require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();

app.use(cors({ origin: process.env.API_42_URI }));
app.use(bodyParser.json());

app.post('/oauth/token', async (req, res) => {
  try {
    const { code } = req.body;

    const response = await axios.post('https://api.intra.42.fr/oauth/token', {
      grant_type: 'authorization_code',
      client_id: process.env.API_42_UID,
      client_secret: process.env.API_42_SECRET,
      code,
      redirect_uri: process.env.API_42_REDIRECT_URI,
    });

    res.json({ access_token: response.data.access_token });
  } catch (error) {
    console.error('Erreur OAuth:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: 'Erreur lors de l\'authentification.' });
  }
});

app.post('/auth/validate', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token manquant' });
  }

  try {
    const response = await axios.get('https://api.intra.42.fr/v2/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    res.status(200).json({ id: response.data.id, login: response.data.login });
  } catch (error) {
    console.error('Erreur lors de la validation du token :', error.response?.data || error.message);
    res.status(401).json({ error: 'Token invalide ou expiré' });
  }
});


app.get('/logs', async (req, res) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  const token = authorization.split(' ')[1];

  try {
    const userResponse = await axios.get('https://api.intra.42.fr/v2/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const user = userResponse.data;
    const userId = user.id;

    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString();
    const endOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)).toISOString();

    console.log(`Fetching logs from ${startOfMonth} to ${endOfMonth}`);

    const logsResponse = await axios.get(
      `https://api.intra.42.fr/v2/users/${userId}/locations`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          begin_at: startOfMonth,
          end_at: endOfMonth,
        },
      }
    );

    const logs = logsResponse.data;

    const result = logs.map((log) => {
      const start = log.begin_at;
      const end = log.end_at;

      if (!start) {
        console.warn(`Log invalide détecté : ${JSON.stringify(log)}`);
        return null;
      }

      return {
        begin_at: start,
        end_at: end,
        host: log.host,
      };
    }).filter((log) => log !== null);

    console.log('DEBUG LOG: Result ->', result);

    return res.json(result);
  } catch (error) {
    console.error(`Erreur lors de la récupération des logs : ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la récupération des logs' });
  }
});

const PORT = 5001;
app.listen(PORT, () => console.log(`Backend en cours d'exécution sur http://127.0.0.1:${PORT}`));
