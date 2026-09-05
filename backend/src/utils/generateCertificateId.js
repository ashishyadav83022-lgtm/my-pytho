const crypto = require("crypto");

const generateCertificateId = () => {
  const part1 = crypto.randomBytes(3).toString("hex").toUpperCase();
  const part2 = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `CC-${part1}-${part2}`;
};

module.exports = generateCertificateId;