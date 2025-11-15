require('dotenv').config();

console.log('TOKEN:', process.env.TOKEN);
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? ' Encontrada' : ' Não encontrada');