const {Schema , model} = require("mongoose");

const TokenSchema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: "User"}, // Ссылка на пользователя 
  refreshToken: {type: String, required: true} // RefreshToken 
});

module.exports = model("Token" , TokenSchema) // "Экспортируем,("Token"- Это название)"

// Тут мы создали схему для Token