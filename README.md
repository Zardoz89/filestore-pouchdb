# Simple file storage over PouchDb (WIP)

Handles a simple file storage over PouchDB. Mimics some functionality of a
virtual file system like directories and file hierarchy, but avoids to try to
be a full virtual file system.

## Objectives

Store files on the browser, with the optional capacity of synchronize with a
remote CouchDb database. The retrieving of the files must be fast and each file
it's identified by his path.

## Features

* FileStorage it's implemented over a PouchDb and can return the underlying
    database. So could be configured to synchronize/reply to another databases.
* Return a File by path
* Creation and deletion of directories. Directory extends of File without any
    content
* Equivalent functionality of mkDir -p and rm -r
* Listing all the files, showing the whole tree hierarchy.
* Listing all the files of a directory, showing the whole tree hierarchy
* Methods to delete files, directories and even clean all the whole storage.

## TODOs
* Brother method of getFile that only returns if the file exists
* Moar TESTS!


