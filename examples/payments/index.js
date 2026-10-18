if (window.location.pathname.startsWith('/guest')) require('./guest');
else require('./cafe');
