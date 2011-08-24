
XPI = passwordgenerator.xpi
FILES = chrome chrome.manifest defaults install.rdf

all: passwordgenerator.xpi

passwordgenerator.xpi:
	zip -r $(XPI) $(FILES) -x '*~' '#*#' '.#*'

clean:
	rm -f $(XPI)