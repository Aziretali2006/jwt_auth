const {Schema , model} = require("mongoose");

const UserSchema = new Schema({
  email: {type: String , unique: true , required: true}, // Создали Email строку которую мы потом заполним на клиент части 
  password: {type: String , required: true}, // Создали Password строку 
  isActivated: {type: Boolean , default: false}, 
  activationLink: {type: String},
});

module.exports = model("User" , UserSchema) // "Экспортируем("User"- Это название)"