import React from 'react';

const sparkleStyles = [
  { left: '12%', top: '18%', '--tx': '52px', '--ty': '-38px', '--delay': '-1.5s', '--duration': '8.5s' },
  { left: '28%', top: '78%', '--tx': '-46px', '--ty': '-72px', '--delay': '-5s', '--duration': '10s' },
  { left: '45%', top: '24%', '--tx': '68px', '--ty': '44px', '--delay': '-3.2s', '--duration': '9.2s' },
  { left: '68%', top: '16%', '--tx': '-60px', '--ty': '58px', '--delay': '-6.8s', '--duration': '11s' },
  { left: '82%', top: '70%', '--tx': '42px', '--ty': '-66px', '--delay': '-2.4s', '--duration': '9.8s' },
  { left: '58%', top: '86%', '--tx': '-74px', '--ty': '-46px', '--delay': '-7.6s', '--duration': '12s' },
  { left: '88%', top: '35%', '--tx': '-52px', '--ty': '70px', '--delay': '-4.4s', '--duration': '10.6s' },
  { left: '18%', top: '52%', '--tx': '64px', '--ty': '36px', '--delay': '-8.4s', '--duration': '11.4s' },
  { left: '6%', top: '66%', '--tx': '82px', '--ty': '-24px', '--delay': '-9.5s', '--duration': '9.4s' },
  { left: '36%', top: '12%', '--tx': '-38px', '--ty': '78px', '--delay': '-2.9s', '--duration': '12.8s' },
  { left: '52%', top: '58%', '--tx': '48px', '--ty': '-86px', '--delay': '-6.1s', '--duration': '8.8s' },
  { left: '72%', top: '50%', '--tx': '-86px', '--ty': '-18px', '--delay': '-10.4s', '--duration': '11.8s' },
  { left: '94%', top: '82%', '--tx': '-76px', '--ty': '-58px', '--delay': '-3.7s', '--duration': '13.2s' },
  { left: '24%', top: '34%', '--tx': '32px', '--ty': '82px', '--delay': '-7.1s', '--duration': '9.6s' },
  { left: '76%', top: '10%', '--tx': '34px', '--ty': '92px', '--delay': '-1.9s', '--duration': '10.8s' },
  { left: '40%', top: '92%', '--tx': '72px', '--ty': '-64px', '--delay': '-12.2s', '--duration': '12.4s' },
  { left: '10%', top: '8%', '--tx': '96px', '--ty': '42px', '--delay': '-4.9s', '--duration': '11.2s' },
  { left: '64%', top: '76%', '--tx': '-28px', '--ty': '-92px', '--delay': '-8.9s', '--duration': '10.2s' },
  { left: '84%', top: '22%', '--tx': '-94px', '--ty': '26px', '--delay': '-5.7s', '--duration': '13.6s' },
  { left: '32%', top: '62%', '--tx': '-56px', '--ty': '48px', '--delay': '-11.4s', '--duration': '9.9s' },
  { left: '4%', top: '42%', '--tx': '108px', '--ty': '-70px', '--delay': '-13.3s', '--duration': '10.7s' },
  { left: '14%', top: '88%', '--tx': '44px', '--ty': '-112px', '--delay': '-6.6s', '--duration': '12.1s' },
  { left: '22%', top: '18%', '--tx': '88px', '--ty': '94px', '--delay': '-15.2s', '--duration': '13.1s' },
  { left: '30%', top: '46%', '--tx': '-92px', '--ty': '-54px', '--delay': '-4.1s', '--duration': '8.9s' },
  { left: '44%', top: '72%', '--tx': '106px', '--ty': '-36px', '--delay': '-12.8s', '--duration': '11.6s' },
  { left: '50%', top: '8%', '--tx': '-82px', '--ty': '114px', '--delay': '-7.9s', '--duration': '12.7s' },
  { left: '60%', top: '36%', '--tx': '96px', '--ty': '62px', '--delay': '-14.6s', '--duration': '9.7s' },
  { left: '70%', top: '92%', '--tx': '-104px', '--ty': '-72px', '--delay': '-5.2s', '--duration': '13.8s' },
  { left: '78%', top: '64%', '--tx': '58px', '--ty': '-106px', '--delay': '-10.9s', '--duration': '10.4s' },
  { left: '90%', top: '56%', '--tx': '-112px', '--ty': '44px', '--delay': '-16.1s', '--duration': '12.9s' },
  { left: '96%', top: '14%', '--tx': '-96px', '--ty': '100px', '--delay': '-8.1s', '--duration': '11.1s' },
  { left: '38%', top: '30%', '--tx': '62px', '--ty': '-110px', '--delay': '-2.2s', '--duration': '9.3s' },
  { left: '56%', top: '48%', '--tx': '-118px', '--ty': '32px', '--delay': '-17.2s', '--duration': '14s' },
  { left: '68%', top: '28%', '--tx': '78px', '--ty': '-84px', '--delay': '-3.5s', '--duration': '10.9s' },
  { left: '8%', top: '76%', '--tx': '118px', '--ty': '30px', '--delay': '-9.8s', '--duration': '12.5s' },
  { left: '46%', top: '88%', '--tx': '-66px', '--ty': '-118px', '--delay': '-1.1s', '--duration': '13.4s' },
];

export default function AuthSidebar() {
  return (
    <div className="auth-designed-bg" aria-label="JABIL stability and zero downtime background">
      <div className="auth-bg-grid" aria-hidden="true" />
      <div className="auth-sparkles" aria-hidden="true">
        {sparkleStyles.map((style, index) => (
          <span key={index} className="auth-sparkle" style={style} />
        ))}
      </div>

      <section className="auth-copy-panel" aria-hidden="true">
        <img className="auth-brand-logo" src="/auth-jabil-logo.png" alt="" />
        <h2>
          Designed for <span>Stability.</span>
          <br />
          Trusted for <span>Performance.</span>
        </h2>
        <i className="auth-copy-line" />
        <p>Create your account and get seamless access to the tools and applications you need.</p>

      </section>

      <div className="auth-image-missing">
        <strong>Auth image missing</strong>
        <span>Expected assets in frontend/public: auth-jabil-logo.png, auth-jabil-advance.png, auth-downtime.png</span>
      </div>
    </div>
  );
}
