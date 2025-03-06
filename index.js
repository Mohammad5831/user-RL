const express = require('express');
const userRoutes = require('./routes/usersRoute');
const sequelize = require('./utilities/mysql_db');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/users', userRoutes);

sequelize.sync().then(() => {
  console.log('Database synced');
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
