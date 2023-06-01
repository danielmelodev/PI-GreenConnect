const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const { format } = require('date-fns');

// Obtenha a data atual
const dataAtual = new Date();

// Formate a data no padrão brasileiro
const dataFormatada = format(dataAtual, 'dd/MM/yyyy');

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
    default: dataFormatada
  },
  
})

mongoose.model('parceiros', Parceiros)