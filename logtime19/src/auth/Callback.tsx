import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Callback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const code = queryParams.get('code');

    if (code) {
      fetch(`${import.meta.env.VITE_API_42_URI}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.access_token) {
            localStorage.setItem('access_token', data.access_token);
            navigate('/home');
          } else {
            console.error('Erreur d\'authentification :', data);
          }
        })
        .catch((err) => console.error('Erreur réseau :', err));
    }
  }, []);

  return <div>Connexion en cours...</div>;
};

export default Callback;
