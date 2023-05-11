const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const Relatos = new Schema({
  image: {
    type: String,
    required: true 
  },
  setor: {
    type: String,
    required: true
  },
  titulo: {
    type: String,
    required: true
  },
  descricao: {
    type: String,
    required: true
  },
  categoria:{
    type: Schema.Types.ObjectId,
    ref: "categorias"
  },
  //a data exata do cadastro
  data:{
    type: Date,
    default: Date.now()
  },
  
})

mongoose.model('relatos', Relatos)