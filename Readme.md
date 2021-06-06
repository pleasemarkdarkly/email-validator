## Email Validator
Bulk email validator using the leaked [Collection #1-5](https://www.troyhunt.com/the-773-million-record-collection-1-data-reach/) username, password, and email account leaks.  Collection #1 contains 2,692,818,238 rows of usernames and passwords.

### Help
```bash
yarn && yarn tsc && node ./dist/index.js --help
--help for help, <command> --help for command-specific help

Commands:
  index.js validate     Validate emails contained within .tar.gz files.
  index.js removedupes  Removes duplicate emails in all .array.txt files under a
                        directory. Restarting the program may often validate
                        some emails twice. (Memory expensive operation.)
  index.js              --help for help, <command> --help for command-specific
                        help                                           [default]

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

#### Usage
For example:
```bash
yarn && yarn tsc && node ./developer/email-validator/dist/index.js validate --dir /mnt/sda/collection/emails --outputDir /mnt/sda/collection/validated_emails
```