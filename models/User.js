module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true }
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'user'
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: { isEmail: true, notEmpty: true }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { 
        unique: true, 
        fields: ['email'] 
      },
      {
        fields: ['role']
      }
    ]
  });

  // Add associations
  User.associate = function(models) {
    // Associations are defined in models/index.js
  };

  return User;
};