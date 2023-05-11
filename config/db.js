const mongoose = require('mongoose')
const mongoURI = 'mongodb+srv://daniel:82490712@clusternew.luseugn.mongodb.net/?retryWrites=true&w=majority'
mongoose.set('strictQuery', true);
mongoose.connect(mongoURI,{
  useUnifiedTopology: true,
  useNewUrlParser: true
})
.then(db => console.log('Banco de dados conectado!', db.connection.host))
.catch(error => console.log(error) )