import FileStorage from './fileStorage.js'

console.log('Hola')

const fileStorage = FileStorage.initFileSystem()

console.log(fileStorage)

fileStorage.addFile(new FileStorage.File('prueba0.txt', 'texto prueba 0', '', 'hola mundo'))
  .catch(err => console.error(err))
fileStorage.addFile(new FileStorage.File('/dir/prueba1.txt', 'texto prueba 1', '', 'hola mundo'))
  .catch(err => console.error(err))
fileStorage.addFile(new FileStorage.File('/dir2/prueba2.txt', 'texto prueba 2', '', 'hola mundo'))
  .catch(err => console.error(err))
fileStorage.addFile(new FileStorage.File('/dir/subdir/prueba2.txt', 'texto prueba 3', '', 'hola mundo'))
  .catch(err => console.error(err))

fileStorage.listAllFiles()
  .then(files => console.log(files))

fileStorage.getFileFromHash('texto prueba 0')
  .then(file => console.log(file))
  .catch(err => console.error(err))

fileStorage.getFileFromHash('texto prueba 3')
  .then(file => console.log(file))
  .catch(err => console.error(err))

fileStorage.getFileFromHash('texto prueba 99')
  .then(file => console.log(file))
  .catch(err => console.error(err))

fileStorage.getFile('prueba0.txt')
/*
fileStorage.getFile('dir/prueba1.txt')
fileStorage.getFile('dir/prueba99.txt')
*/

// Se hace esto con un timeout para que no lance el error de mutación
setTimeout(function () {
  fileStorage.format()
}, 1000)

// vim: set backupcopy=yes :
