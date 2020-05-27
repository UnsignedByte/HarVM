// This should make it more convenient to batch calls by making things
// syntactic sugar for other things
export default function batch ({ unparsedArgs, run, temp }) {
	// TODO: Remove the optional ``` code block, probably using fancy regex
}

// Ideally:
/*
# Comments starting with # are removed
data set 2 -> a

# A colon followed by a word indicates that the following lines will be stored
# in a VARIABLE; this can be passed into methods that can run the commands.
# This is actually a separate command inserted before the line; maybe it'll use
# its own setter like `batch storeBlock`
:if control if "$(a)" = 2 "batch $(if)" "batch $(else)"
	# `batch` is indentation sensitive. If the next line is more indented than the
	# previous, it'll use that as the baseline indent. All the following lines will
	# be deindented when stored in the variable.
	data log "a is equal to 2, epic"
:else
	# I think for situations where there are multiple blocks in a row, it'll group
	# the store commands before the actual command. Hmm
	data log "a is not equal to 2...?"

:str data log "$(str)"
	"Blocks" can actually be used for multiline strings.
*/
