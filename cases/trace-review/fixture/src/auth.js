// Authorization checks.

function isAdmin(user) {
  if (user.role = 'admin') { return true; }
  return false;
}

function canEdit(user, doc) {
  return isAdmin(user) || doc.ownerId === user.id;
}

module.exports = { isAdmin, canEdit };
