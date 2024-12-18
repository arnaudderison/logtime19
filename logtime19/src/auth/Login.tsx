import { useEffect, useState } from "react";
import { getAuth, useAuth } from "./AuthProvider";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

function Login() {
  const clientId = import.meta.env.VITE_API_42_UID;
  const redirectUri = import.meta.env.VITE_API_42_REDIRECT_URI;
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [busy, setBusy] = useState(false);

  const handleLogin = () => {
    const authUrl = `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
    window.location.href = authUrl;
  };

  useEffect(() => {
    console.log(import.meta.env.VITE_API_42_URI);
    setBusy(true);
    if (localStorage.getItem('access_token')) {
      getAuth()
        .then((user) => {
          setUser(user);
          navigate('/home');
        });
    }
    setBusy(false);
  }, []);

  if (busy) return <div>Connexion en cours...</div>;

  return (
    <div className="container">
      <h1>Se connecter</h1>
      <button className="button" onClick={handleLogin}>Se connecter avec 42</button>
    </div>
  );
}

export default Login;
