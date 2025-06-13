const getUsers = (req, res) => {
  res.json({ message: 'Liste des utilisateurs' });
};

const addUser = (req, res) => {
  const { name, email } = req.body;
  res.json({ message: `Utilisateur ${name} ajouté avec succès !`, email });
};

module.exports = { getUsers, addUser };
