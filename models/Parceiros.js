const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const Parceiros = new Schema({
  image: {
    type: String,
    required: true 
  },
  corporatename: {
    type: String,
    required: true
  },
  redesocial: {
    type: String,
    required: true
  },
  cnpj:{
    type: String,
    required: true
  },
  describe: {
    type: String,
    required: true
  },
  //a data exata do cadastro
  data:{
    type: Date,
    default: Date.now()
  },
  
})

mongoose.model('parceiros', Parceiros)