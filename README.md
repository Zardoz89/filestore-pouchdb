# Simple file storage over PouchDb


Handles a simple file storage over PouchDB. Mimics some functionality of a virtual filesystem like directories and
file hierarchy, but avoids to try to be a full virtual filesystem.

## TODOs
* File class should have a hash attribute or getter that calcs hash if isn't calculated previsuly
* Attach file data and generate hash from it. Adding a file should return the file hash
* Overwrite a file
* Creating a file on a not existent path should throw an error or create a directory silenty (config this by options)
* Delete directory
* Brother methos of getFile and getFileFromHash that only returns if the file exists
* TESTS!

### Optional TODOs
* Directory subclass of File that is returned when getFile or getFileFromHash returns a directory file. MkDir must use it
* List a directory content

