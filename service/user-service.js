const UserModel = require("../models/user-model");
const bcrypt = require("bcrypt");
const uuid = require("uuid");
const mailService = require("./mail-service");
const tokenService = require("./token-service");
const UserDto = require("../dtos/user-dto");
const ApiError = require("../exeptions/api-error");

class UserService {
  async registration(email, password) {
    const candidate = await UserModel.findOne({email}) //Должны убедиться что нету похожих email
    if(candidate) {
      throw ApiError.BadRequest(`Пользователь с таким ${email} уже существует`)
    }
    const hashPassword = await bcrypt.hash(password, 3); //Хaшируем пароль
    const activationLink = uuid.v4();
    const user = await UserModel.create({email, password: hashPassword , activationLink}) // И в базу данных отправляем захaшированный пароль
    // await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}` );
    const userDto = new UserDto(user); //id, email, isActivated
    const tokens = tokenService.generateTokens({...userDto}); //Тут мы отправляем данные, мы не можеи отправить все данные из-за этого мы делаем UserDto
    await tokenService.saveToken(userDto.id , tokens.refreshToken) //Сохраняем в базу данных
    return {
      ...tokens, //Возвращаем token 
      user: userDto //Возвращаем информацию о пользовател 
    }
  }

  async activate(activationLink) {
    const user = await UserModel.findOne({activationLink});
    if(!user) {
      throw ApiError.BadRequest("Неккоректная ссылка активации.")
    };
    user.isActivated = true;
    await user.save();
  };

  async login(email , password) {
    const user = await UserModel.findOne({email});//Тут мы проверяем на email, и делаем проверку
    if(!user) {
      throw ApiError.BadRequest("Пользователь с таким email не найден")//Тут мы делаем условия на email, если email нету то будет ошибка
    };
    const isPassEqual = await bcrypt.compare(password, user.password); //Хешируем пароль и сравниваем
    if(!isPassEqual) {
      throw ApiError.BadRequest("Неверный пароль")
    }
    const userDto = new UserDto(user);
    const tokens = tokenService.generateTokens({...userDto});
    await tokenService.saveToken(userDto.id , tokens.refreshToken) //Сохраняем в базу данных
    return {
      ...tokens, //Возвращаем token 
      user: userDto //Возвращаем информацию о пользовател 
    }

  }

  async logOut(refreshToken) {
    const token = await tokenService.removeToken(refreshToken);
    return token;
  }

  async refresh(refreshtoken) {
    if(!refreshtoken) {
      throw ApiError.UnauthorizedError()
    };
    const userData = tokenService.validateRefreshToken(refreshtoken);
    const tokenFromDb = tokenService.findToken(refreshToken);
    if(!userData || !tokenFromDb) {
      throw ApiError.UnauthorizedError();
    };
    const user = UserModel.findById(userData.id);
    const userDto = new UserDto(user);
    const tokens = tokenService.generateTokens({...userDto});

    await tokenService.saveToken(userDto.id , tokens.refreshToken);
    return {...tokens , user: userDto};
  }

  async getAllUsers() {
    const users = await UserModel.find();
    return users;
  }
};

module.exports = new UserService()