/* 雅阁租房 · 用户平台 · 路由入口 */

function App() {
  const [hash, setHash] = React.useState(window.location.hash || '#/');
  const [user, setUser] = React.useState(null);
  const [currentCity, setCurrentCity] = React.useState('杭州');

  React.useEffect(() => {
    const onChange = () => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const path = hash.replace(/^#\/?/, '').split('?')[0];
  const qs = hash.split('?')[1] || '';
  const params = Object.fromEntries(new URLSearchParams(qs));
  const segs = path.split('/').filter(Boolean);

  const handleLogin = (u) => setUser(u);
  const handleLogout = () => { setUser(null); window.location.hash = '#/'; };
  const handleVerify = () => setUser(u => u ? { ...u, verified: true } : u);

  const props = { user, currentCity, onCity: setCurrentCity };

  switch (segs[0]) {
    case undefined:
    case '':
      return <PortalHome {...props}/>;
    case 'login':
      return <PortalLogin currentCity={currentCity} onLogin={handleLogin}/>;
    case 'register':
      return <PortalRegister currentCity={currentCity}/>;
    case 'search':
      return <PortalSearch {...props} params={params}/>;
    case 'map':
      return <PortalMap {...props}/>;
    case 'communities':
      return <PortalCommunities {...props}/>;
    case 'community':
      return <PortalCommunityDetail id={segs[1]} {...props}/>;
    case 'room':
      return <PortalRoomDetail id={segs[1]} {...props}/>;
    case 'publish':
      if (!user) { setTimeout(() => window.location.hash = '#/login', 0); return null; }
      if (segs[1] === 'community') return <PublishCommunity {...props}/>;
      if (segs[1] === 'room')      return <PublishRoom {...props} editId={params.edit}/>;
      return <PublishCommunity {...props}/>;
    case 'profile':
      if (!user) { setTimeout(() => window.location.hash = '#/login', 0); return null; }
      const profileProps = { ...props, onLogout: handleLogout, onVerify: handleVerify };
      switch (segs[1]) {
        case 'rooms':       return <ProfileRooms       {...profileProps}/>;
        case 'collection':  return <ProfileCollection  {...profileProps}/>;
        case 'appointment': return <ProfileAppointment {...profileProps}/>;
        case 'contract':    return <ProfileContract    {...profileProps}/>;
        case 'order':       return <ProfileOrder       {...profileProps}/>;
        default:            return <ProfileInfo        {...profileProps}/>;
      }
    default:
      return <PortalHome {...props}/>;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
