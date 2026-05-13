/**
 * Native PowerShell Profile Cleanup Script
 * Uses Win32_UserProfile CIM class for enterprise-grade profile management
 */

const fs = require('fs');
const path = require('path');

class PowerShellCleanupEngine {
  constructor() {
    this.scriptPath = path.join(__dirname, 'cleanup-profiles.ps1');
    this.ensureScriptExists();
  }

  ensureScriptExists() {
    const scriptContent = `
param(
  [Parameter(Mandatory=$true)]
  [string]$ServerName,

  [Parameter(Mandatory=$true)]
  [string]$Username,

  [Parameter(Mandatory=$true)]
  [string]$Password,

  [Parameter(Mandatory=$false)]
  [int]$InactiveHours = 8,

  [Parameter(Mandatory=$false)]
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$VerbosePreference = 'Continue'

# Secure credential handling
$securePassword = ConvertTo-SecureString $Password -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential ($Username, $securePassword)

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Starting profile cleanup on $ServerName"
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Inactive threshold: $InactiveHours hours"

try {
  # Test WinRM connectivity
  Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Testing WinRM connectivity..."
  $testSession = New-PSSession -ComputerName $ServerName -Credential $credential -ErrorAction Stop
  Remove-PSSession $testSession
  Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] WinRM connection successful"

  # Create remote session
  Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Establishing PowerShell session..."
  $session = New-PSSession -ComputerName $ServerName -Credential $credential

  # Execute cleanup script remotely
  $remoteScript = {
    param($inactiveHours, $dryRun)

    $currentTime = Get-Date
    $inactiveThreshold = $currentTime.AddHours(-$inactiveHours)

    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Starting profile scan on $(hostname)"

    # Get all user profiles using Win32_UserProfile
    $allProfiles = Get-CimInstance -ClassName Win32_UserProfile
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Found $($allProfiles.Count) total profiles"

    # Filter profiles in C:\\Users
    $userProfiles = $allProfiles | Where-Object {
      $_.LocalPath -and $_.LocalPath -match '^C:\\\\Users\\\\'
    }
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Found $($userProfiles.Count) user profiles in C:\\Users"

    # Define system profiles to exclude
    $systemProfiles = @(
      'Administrator',
      'Default',
      'Public',
      'Default User',
      'All Users',
      'WDAGUtilityAccount',
      'DefaultAppPool',
      'DefaultAccount',
      'NetworkService',
      'LocalService',
      'System'
    )

    # Get currently logged-in users
    $loggedInUsers = @()
    try {
      $sessions = query user 2>$null | Select-Object -Skip 1
      foreach ($session in $sessions) {
        $parts = $session -split '\\s+'
        if ($parts.Length -ge 1) {
          $userName = $parts[0].Trim()
          if ($userName -and $userName -ne 'USERNAME') {
            $loggedInUsers += $userName
          }
        }
      }
    } catch {
      Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Warning: Could not query logged-in users: $($_.Exception.Message)"
    }

    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Currently logged-in users: $($loggedInUsers -join ', ')"

    # Filter eligible profiles for cleanup
    $eligibleProfiles = $userProfiles | Where-Object {
      $profileName = Split-Path $_.LocalPath -Leaf

      # Exclude system profiles
      if ($systemProfiles -contains $profileName) {
        return $false
      }

      # Exclude currently logged-in users
      if ($loggedInUsers -contains $profileName) {
        return $false
      }

      # Exclude loaded profiles
      if ($_.Loaded) {
        return $false
      }

      # Exclude special profiles
      if ($_.Special) {
        return $false
      }

      # Must have LastUseTime
      if (-not $_.LastUseTime) {
        return $false
      }

      # Check if inactive for required hours
      $lastUseTime = [DateTime]::FromFileTime($_.LastUseTime)
      $isInactive = $lastUseTime -lt $inactiveThreshold

      return $isInactive
    }

    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Found $($eligibleProfiles.Count) eligible profiles for cleanup"

    $cleanupResults = @{
      scanned = $userProfiles.Count
      eligible = $eligibleProfiles.Count
      deleted = @()
      failed = @()
      spaceFreed = 0
      executionTime = 0
    }

    $startTime = Get-Date

    if ($dryRun) {
      Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] DRY RUN MODE - No profiles will be deleted"

      foreach ($profile in $eligibleProfiles) {
        $profileName = Split-Path $profile.LocalPath -Leaf
        $lastUseTime = [DateTime]::FromFileTime($profile.LastUseTime)
        $hoursInactive = [math]::Round(($currentTime - $lastUseTime).TotalHours, 1)

        Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Would delete: $profileName (inactive: $hoursInactive hours)"
        $cleanupResults.deleted += $profileName
      }
    } else {
      foreach ($profile in $eligibleProfiles) {
        $profileName = Split-Path $profile.LocalPath -Leaf
        $lastUseTime = [DateTime]::FromFileTime($profile.LastUseTime)
        $hoursInactive = [math]::Round(($currentTime - $lastUseTime).TotalHours, 1)

        Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Deleting profile: $profileName (inactive: $hoursInactive hours)"

        try {
          # Calculate space before deletion
          $profileSize = 0
          if (Test-Path $profile.LocalPath) {
            $profileSize = (Get-ChildItem $profile.LocalPath -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
          }

          # Remove the profile using CIM
          $profile | Remove-CimInstance

          $cleanupResults.deleted += $profileName
          $cleanupResults.spaceFreed += $profileSize

          Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Successfully deleted: $profileName ($([math]::Round($profileSize / 1MB, 2)) MB)"

        } catch {
          $errorMsg = "Failed to delete $($profileName): $($_.Exception.Message)"
          Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ERROR: $errorMsg"
          $cleanupResults.failed += $profileName
        }
      }
    }

    $cleanupResults.executionTime = [math]::Round((Get-Date).Subtract($startTime).TotalSeconds, 2)

    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Cleanup completed in $($cleanupResults.executionTime) seconds"
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Results: $($cleanupResults.deleted.Count) deleted, $($cleanupResults.failed.Count) failed, $([math]::Round($cleanupResults.spaceFreed / 1MB, 2)) MB freed"

    # Return structured results
    return @{
      server = $env:COMPUTERNAME
      timestamp = Get-Date -Format 'o'
      scanned = $cleanupResults.scanned
      eligible = $cleanupResults.eligible
      deleted = $cleanupResults.deleted
      failed = $cleanupResults.failed
      spaceFreed = $cleanupResults.spaceFreed
      executionTime = $cleanupResults.executionTime
      dryRun = [bool]$dryRun
    }
  }

  Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Executing cleanup script remotely..."
  $results = Invoke-Command -Session $session -ScriptBlock $remoteScript -ArgumentList $InactiveHours, $DryRun

  # Clean up session
  Remove-PSSession $session

  Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Cleanup completed successfully"
  return $results

} catch {
  Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ERROR: $($_.Exception.Message)"
  throw
}
`;

    if (!fs.existsSync(this.scriptPath)) {
      fs.writeFileSync(this.scriptPath, scriptContent, 'utf8');
    }
  }

  async executeCleanup(serverName, username, password, options = {}) {
    const { inactiveHours = 8, dryRun = false } = options;

    // Build PowerShell command
    const command = [
      'powershell.exe',
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', this.scriptPath,
      '-ServerName', serverName,
      '-Username', username,
      '-Password', password,
      '-InactiveHours', inactiveHours.toString()
    ];

    if (dryRun) {
      command.push('-DryRun');
    }

    // Execute the command
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      const { stdout, stderr } = await execAsync(command.join(' '), {
        timeout: 300000, // 5 minutes timeout
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      if (stderr) {
        console.warn('PowerShell warnings:', stderr);
      }

      // Parse the output (assuming it returns JSON)
      const result = JSON.parse(stdout.trim());
      return result;

    } catch (error) {
      throw new Error(`PowerShell cleanup failed: ${error.message}`);
    }
  }
}

module.exports = PowerShellCleanupEngine;
