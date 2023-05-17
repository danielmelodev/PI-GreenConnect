const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const Blogs = new Schema({
  image: {
    type: String,
    required: true 
  },
  name: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  //a data exata do cadastro
  data:{
    type: Date,
    default: Date.now()
  },
  
})

mongoose.model('blogs', Blogs)