const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const Categoria = new Schema({
  nome: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true
  },
  //a data exata do cadastro
  date:{
    type: Date,
    default: Date.now()
  }
})

mongoose.model('categorias', Categoria)