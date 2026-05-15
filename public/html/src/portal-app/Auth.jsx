/* 雅阁租房 · 用户平台 · 登录 / 注册 */

function PortalLogin({ currentCity, onLogin }) {
  const [tab, setTab] = React.useState('pwd');
  const [verified, setVerified] = React.useState(false);

  const fakeLogin = () => {
    onLogin && onLogin({
      name: '守望者', username: 'l0gqSCj', phone: '13800000000', email: '',
      verified: verified,            // 是否实名（房东）
      lastLogin: '2026-05-15 07:41:52',
    });
    window.location.hash = '#/';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #E8FBF3 0%, #F5FCF8 100%)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: -120, top: -80, width: 480, height: 480, borderRadius: 240, background: 'radial-gradient(circle, rgba(37,213,160,.18), transparent 70%)' }}/>
      <div style={{ position: 'absolute', left: -80, bottom: -60, width: 360, height: 360, borderRadius: 180, background: 'radial-gradient(circle, rgba(37,213,160,.10), transparent 70%)' }}/>

      <header className="container" style={{ padding: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a className="p-logo" href="#/">
          <span className="p-logo-mark">雅</span>
          <span className="p-logo-text">雅阁租房</span>
          <span className="p-logo-sub">{currentCity}</span>
        </a>
        <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>没有账号？<a href="#/register" style={{ color: 'var(--primary)' }}>立即注册 ›</a></div>
      </header>

      <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 460px', gap: 60, alignItems: 'center', padding: '40px 0 80px', position: 'relative' }}>
        {/* 左侧标语 */}
        <div>
          <div style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, letterSpacing: '.2em', marginBottom: 16 }}>WELCOME BACK</div>
          <h1 style={{ margin: 0, fontSize: 44, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-.01em' }}>
            欢迎回来，<br/>
            <span style={{ color: 'var(--primary)' }}>您的家在等你</span>
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-3)', marginTop: 22, lineHeight: 1.8, maxWidth: 460 }}>
            286 万套实勘房源 · 82 万认证房东 · 全程零中介费<br/>
            登录后查看您的预约、合同与收藏。
          </p>
          <div style={{ display: 'flex', gap: 20, marginTop: 36 }}>
            {[['286万', '在租房源'],['82万', '认证房东'],['4.8★', '租客评分'],['零', '中介费用']].map(([n, l]) => (
              <div key={l}>
                <div className="num" style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)' }}>{n}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧表单 */}
        <div style={{ background: '#fff', borderRadius: 8, padding: '40px 36px', boxShadow: '0 20px 50px rgba(0,0,0,.08)' }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>账号登录</h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>使用您的雅阁账号登录</p>

          <div style={{ display: 'flex', gap: 28, marginTop: 26, borderBottom: '1px solid var(--line)' }}>
            {[['pwd','密码登录'],['sms','短信验证码']].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                padding: '10px 0', fontSize: 14,
                fontWeight: tab === k ? 600 : 500,
                color: tab === k ? 'var(--ink)' : 'var(--ink-3)',
                borderBottom: tab === k ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: -1,
              }}>{l}</button>
            ))}
          </div>

          <div style={{ marginTop: 22 }}>
            <div style={{ marginBottom: 16 }}>
              <div className="label">{tab === 'pwd' ? '账号' : '手机号'}</div>
              <input className="input" placeholder={tab === 'pwd' ? '请输入用户名或手机号' : '+86  请输入手机号'} style={{ height: 42 }}/>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div className="label">{tab === 'pwd' ? '密码' : '验证码'}</div>
              {tab === 'pwd' ? (
                <input className="input" type="password" placeholder="请输入密码" style={{ height: 42 }}/>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="input" placeholder="6 位验证码" style={{ flex: 1, height: 42 }}/>
                  <button className="btn btn-line" style={{ height: 42 }}>获取验证码</button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-2)' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)' }}/>
                7 天内自动登录
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-2)' }}>
                <input type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)} style={{ accentColor: 'var(--primary)' }}/>
                以已认证房东身份登录 <span style={{ color: 'var(--ink-4)' }}>(演示用)</span>
              </label>
            </div>

            <button className="btn btn-primary btn-block btn-lg" onClick={fakeLogin}>登 录</button>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 16 }}>
              <a style={{ color: 'var(--ink-3)' }}>忘记密码？</a>
              <a href="#/register" style={{ color: 'var(--primary)' }}>立即注册 ›</a>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--ink-4)', fontSize: 12, margin: '24px 0 14px' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--line)' }}/>其他方式<div style={{ flex: 1, height: 1, background: 'var(--line)' }}/>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
              {[['微','#06AE56'],['付','#1AAEEE'],['Q','#12B7F5']].map(([c, bg]) => (
                <button key={c} style={{ width: 42, height: 42, borderRadius: 21, border: '1px solid var(--line)', color: bg, fontSize: 18, fontWeight: 700, display: 'grid', placeItems: 'center' }}>{c}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PortalRegister({ currentCity }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #E8FBF3 0%, #F5FCF8 100%)' }}>
      <header className="container" style={{ padding: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a className="p-logo" href="#/">
          <span className="p-logo-mark">雅</span>
          <span className="p-logo-text">雅阁租房</span>
          <span className="p-logo-sub">{currentCity}</span>
        </a>
        <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>已有账号？<a href="#/login" style={{ color: 'var(--primary)' }}>立即登录 ›</a></div>
      </header>

      <div style={{ display: 'grid', placeItems: 'center', padding: '40px 0 80px' }}>
        <div style={{ background: '#fff', borderRadius: 8, padding: 40, width: 540, boxShadow: '0 20px 50px rgba(0,0,0,.08)' }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>注册新账号</h2>
          <p style={{ margin: '6px 0 28px', fontSize: 13, color: 'var(--ink-3)' }}>30 秒完成注册，享受零中介费租房</p>

          {/* 步骤 */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
            {['填写信息','短信验证','完成'].map((s, i) => (
              <React.Fragment key={s}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: i === 0 ? 'var(--primary)' : '#F0F0F0',
                    color: i === 0 ? '#fff' : 'var(--ink-4)',
                    fontSize: 12, fontWeight: 700, display: 'grid', placeItems: 'center',
                  }}>{i + 1}</div>
                  <span style={{ fontSize: 13, fontWeight: i === 0 ? 600 : 500, color: i === 0 ? 'var(--ink)' : 'var(--ink-4)' }}>{s}</span>
                </div>
                {i < 2 && <div style={{ flex: 1, height: 1, background: 'var(--line)', margin: '0 14px' }}/>}
              </React.Fragment>
            ))}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div className="label">手机号 <span className="req">*</span></div>
            <input className="input" placeholder="+86  请输入手机号" style={{ height: 42 }}/>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div className="label">用户名 <span className="req">*</span></div>
            <input className="input" placeholder="4-20 位字母 / 数字组合" style={{ height: 42 }}/>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div className="label">设置密码 <span className="req">*</span></div>
            <input className="input" type="password" placeholder="至少 8 位，含字母和数字" style={{ height: 42 }}/>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div className="label">确认密码 <span className="req">*</span></div>
            <input className="input" type="password" placeholder="再次输入密码" style={{ height: 42 }}/>
          </div>

          <label style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6, marginTop: 6 }}>
            <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)', marginTop: 3 }}/>
            <span>我已阅读并同意 <a style={{ color: 'var(--primary)' }}>《雅阁租房用户协议》</a> 和 <a style={{ color: 'var(--primary)' }}>《隐私政策》</a></span>
          </label>

          <button className="btn btn-primary btn-block btn-lg" style={{ marginTop: 20 }}>下一步</button>
        </div>
      </div>
    </div>
  );
}

/* —— 实名认证（房东）—— */
function VerifyModal({ onClose, onDone }) {
  const [step, setStep] = React.useState(1);

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-title">实名认证 · 成为房东</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>完成认证后即可发布房源 · 通常 1-2 个工作日审核</div>
          </div>
          <button className="modal-close" onClick={onClose}><PI.X/></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 26 }}>
            {['填写身份信息','上传证件','提交审核'].map((s, i) => (
              <React.Fragment key={s}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: step > i ? 'var(--primary)' : (step === i + 1 ? 'var(--primary)' : '#F0F0F0'),
                    color: step >= i + 1 ? '#fff' : 'var(--ink-4)',
                    fontSize: 12, fontWeight: 700, display: 'grid', placeItems: 'center',
                  }}>{step > i + 1 ? '✓' : i + 1}</div>
                  <span style={{ fontSize: 13, color: step === i + 1 ? 'var(--ink)' : 'var(--ink-3)', fontWeight: step === i + 1 ? 600 : 500 }}>{s}</span>
                </div>
                {i < 2 && <div style={{ flex: 1, height: 1, background: step > i + 1 ? 'var(--primary)' : 'var(--line)', margin: '0 14px' }}/>}
              </React.Fragment>
            ))}
          </div>

          {step === 1 && (
            <>
              <div className="row row-2" style={{ marginBottom: 14 }}>
                <div>
                  <div className="label">真实姓名 <span className="req">*</span></div>
                  <input className="input" placeholder="与身份证一致"/>
                </div>
                <div>
                  <div className="label">身份证号 <span className="req">*</span></div>
                  <input className="input" placeholder="18 位身份证号"/>
                </div>
              </div>
              <div className="row row-2" style={{ marginBottom: 14 }}>
                <div>
                  <div className="label">联系电话 <span className="req">*</span></div>
                  <input className="input" defaultValue="13800000000"/>
                </div>
                <div>
                  <div className="label">联系邮箱</div>
                  <input className="input" placeholder="可选"/>
                </div>
              </div>
              <div>
                <div className="label">户籍地址 <span className="req">*</span></div>
                <input className="input" placeholder="如：浙江省杭州市西湖区..."/>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="row row-2">
              {['身份证人像面','身份证国徽面','房屋所有权证明','本人手持身份证'].map((l, i) => (
                <div key={l}>
                  <div className="label">{l} {(i < 2 || i === 3) && <span className="req">*</span>}</div>
                  <div style={{ aspectRatio: '8/5', border: '1.5px dashed var(--line)', borderRadius: 4, background: 'var(--bg)', display: 'grid', placeItems: 'center', color: 'var(--ink-3)', fontSize: 13, cursor: 'pointer' }}>
                    <div style={{ textAlign: 'center' }}>
                      <PI.Plus style={{ width: 22, height: 22, marginBottom: 4 }}/>
                      <div>点击上传</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}>≤ 5MB · jpg / png</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
                <PI.Verified style={{ width: 36, height: 36 }}/>
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>提交成功</h3>
              <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
                您的实名认证申请已提交，预计 1-2 个工作日完成审核。<br/>
                审核结果将通过短信通知您，请保持手机畅通。
              </p>
            </div>
          )}
        </div>
        <div className="modal-foot">
          {step > 1 && step < 3 && <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>上一步</button>}
          {step < 3 ? (
            <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>{step === 2 ? '提交审核' : '下一步'}</button>
          ) : (
            <button className="btn btn-primary" onClick={() => { onDone && onDone(); onClose(); }}>完成</button>
          )}
        </div>
      </div>
    </div>
  );
}

window.PortalLogin = PortalLogin;
window.PortalRegister = PortalRegister;
window.VerifyModal = VerifyModal;
