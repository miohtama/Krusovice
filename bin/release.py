#!/usr/bin/python
# -*- coding: utf8 -*-
from __future__ import absolute_import, division, print_function, unicode_literals

"""

    Ad hoc Python script for making a releases.
    
    .js and .css files are run through YUI Compressor.
    
    Usage:
    
        release.py [options] [version tag]
        
    Create release to releases/trunk folder::
    
        release.py trunk
        
    Create release to /path/to/release/dir/trunk folder::
        
        release.py -d /path/to/release/dir trunk

    Use version tag trunk for running tests. 

"""

import os
import shutil
import sys
import tempfile
import fnmatch

all_src_js = []

for root, dirnames, filenames in os.walk('src'):
  for filename in fnmatch.filter(filenames, '*.js'):
      all_src_js.append(os.path.join(root, filename))
      
      
print "Source:" + str(all_src_js)      

# Define different user usabble clouad service bundles
BUNDLES = [
    {
        "name" : "Krusovice",
        "js" : all_src_js,
        "css" : [],
    }
]

OPTIONS = None
VERSION = None

# releases folder on CDN
TARGET_PATH = None

# docs folder on CDN
DOCS_PATH = None

# Where our src/ is 
WORKDIR = os.getcwd()

def create_paths( ):

    global TARGET_PATH
    global DOCS_PATH
        
    TARGET_PATH = os.path.join(OPTIONS.targetdir)
    TARGET_PATH = os.path.abspath(TARGET_PATH)
    
    #DOCS_PATH = os.path.join(OPTIONS.targetdir, "..", "docs", VERSION)
    #DOCS_PATH = os.path.abspath(DOCS_PATH)
        
    if not os.path.exists(TARGET_PATH):
        os.makedirs(TARGET_PATH)
        for subpath in ["js", "css", "templates", "images"]:
            os.makedirs(os.path.join(TARGET_PATH, subpath))
    
def add_extra_extension(filepath, extra_ext):
    """
    Add .min or .debug to filename extension
    """
    root, ext = os.path.splitext(filepath) 
    ext = ext[1:] # .js -> js   
    return ".".join([root, extra_ext, ext])

def process_vars(line):
    """
    Update version etc. template line in the release data.
    """

    # Reflect real version to file
    if "$$VERSION_LINE" in line:
        i = line.index('"') + 1
        ie = line.index('"',i)
        line = line[:i] + VERSION + line[ie:]
        
        print "$$VERSION_LINE found. Updated version to '%s'" % VERSION
            
    return line

def create_bundle_core(target, sources, type, name):
    global VERSION
    
    
    print "Creating bundle:" + target +  " sources:" + str(sources)
    
    try:
        os.makedirs(target)
    except:
        # Overriding old
        pass
    
    buffer = ""
    for s in sources:
        path = os.path.join(WORKDIR, s)
        print "Including file:" + path
        f = open(path)
        buffer += f.read()
        f.close()
    
    # Update version
    lines = buffer.split("\n")
    lines = tuple([ process_vars(line) for line in lines ])
    buffer = "\n".join(lines)
    
    for mode in ["debug", "min"]:
        
        output = os.path.join(target, name+ "." + mode + "." + type)
        print "Writing:" + output        
        
        if not OPTIONS.no_compress and mode == "min" and type in ["js", "css"]:
            # Implementes issue #16: Add YUI compressor to release.py
            fh,path = tempfile.mkstemp(suffix = os.path.basename("."+type))
            try:
                f = open(path, 'wt')
                f.write(buffer)
                f.close()
                yui = "java -jar yuicompressor-2.4.6/build/yuicompressor-2.4.6.jar -o %(TARGET)s %(SOURCE)s" % \
                    {"TARGET" : output, "SOURCE" : path}
                print yui
                os.system(yui)
            finally:
                os.remove(path)
        else:
            f = open(output, "wt")
            f.write(buffer)
            f.close()
        
    
def process_bundle(bundle):    
    """ """

    # Create bootstrap
    path = os.path.join(TARGET_PATH, bundle["name"] + "-" + VERSION)
    create_bundle_core(path, bundle["js"], "js", bundle["name"])    
    
    # Local deploys can use templates as is
    #if not OPTIONS.localdeploy:
    if False:                   
        # Copy templates
        for t in bundle["templates"]:
            source = os.path.join(WORKDIR, "templates", t)
            print "Copying template " + source
            target = os.path.join(TARGET_PATH, "templates")
            shutil.copy(source, target)
    

    # Copy images
    

def prepare_images():
    # Image files are shared
    
    if OPTIONS.localdeploy:
        print "Not processing images locally"
        return
        
    images_target = os.path.join(TARGET_PATH, "css", "images")
    
    source = os.path.join(WORKDIR, "css", "images")
    print "Copying images to:" + images_target + " from:" + source
    

    if os.path.exists(os.path.join(images_target)):
        shutil.rmtree(images_target)
                    
    shutil.copytree(source, images_target)
       
def copy_docs():
    """ Copy documentation to CDN hosting under a specific version.
   
    """       
    if OPTIONS.localdeploy:
        print "Not releasing docs locally"
        return
        
    if os.path.exists(os.path.join(DOCS_PATH)):
        shutil.rmtree(DOCS_PATH)
    
    print "Releasing docs to " + DOCS_PATH
    
    source = os.path.join(WORKDIR, "docs")   
    shutil.copytree(os.path.join(source, "apidocs"), os.path.join(DOCS_PATH, "apidocs"))    
    shutil.copytree(os.path.join(source, "manual", "build", "html"), os.path.join(DOCS_PATH, "manual")) 
    
       
def main():
    
    global OPTIONS
    global VERSION
    
    from optparse import OptionParser
    parser = OptionParser()
    parser.add_option("-d", "--dir", dest="targetdir",
                      help="Target directory to write the results. Default: %default",
                      default = os.path.join(WORKDIR, "releases"))

    parser.add_option("-l", "--local-process", dest="localdeploy",
                      help="Compress and merge files CSS and JS files for local testing",
                      default = None)
    
    parser.add_option("", "--no-compress",
                      help="Disable compression",
                      action="store_true",
                      default = False)
    
    (OPTIONS, args) = parser.parse_args()
        
    #if len(args) == 0:
    #    print "Usage release.py [options] [version tag]"
    #    print "See more help with -h"
    #    sys.exit(1)
    
    if OPTIONS.localdeploy == "true":        
        OPTIONS.targetdir = "."    
        VERSION = ""
    else:
        VERSION = args[0] 
    
    print "Krusovice release version %s" % VERSION
    create_paths()
    
    # Create bundles and copy bundle specific files
    for b in BUNDLES:
        process_bundle(b)
    
    #prepare_images()
    #copy_docs()

if __name__ == "__main__":
    main()
    
    
        
