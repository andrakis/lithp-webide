ace.define("ace/mode/lithp_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var LispHighlightRules = function() {
    var keywordControl = "if|while|def|get|set|recurse|next|else|var|import|print|regex|list|" +
                         "tuple|list|dict|scope|length|head|tail|call|invoke|atom|" +
                         "get|set|var|==|++|+|@|and|or|>|<|>=|<=|-|/|index-set|dict-get|dict-set|" +
                         "apply|export|export-global";
    var keywordOperator = "==|and|or|>|<|>=|<=|+|-|/"
    var constantLanguage = "null|nil|true|false";
    var supportFunctions = "prod|map|seq|each|permutations|sum|foldl|reverse|zip|switch|case|default";

    var keywordMapper = this.createKeywordMapper({
        "keyword.control": keywordControl,
        "keyword.operator": keywordOperator,
        "constant.language": constantLanguage,
        "support.function": supportFunctions
    }, "identifier", true);

    this.$rules = 
        {
    "start": [
        {
            token : "comment",
            regex : "%.*$"
        },
        {
            token: ["punctuation.definition.constant.character.lithp", "constant.character.lithp"],
            regex: "(#)((?:\\w|[\\\\+-=<>'\"&#])+)"
        },
        {
            token: ["punctuation.definition.variable.lithp", "variable.other.global.lithp", "punctuation.definition.variable.lithp"],
            regex: "(\\*)(\\S*)(\\*)"
        },
        {
            token : "constant.numeric", // hex
            regex : "0[xX][0-9a-fA-F]+(?:L|l|UL|ul|u|U|F|f|ll|LL|ull|ULL)?\\b"
        }, 
        {
            token : "constant.numeric", // float
            regex : "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?(?:L|l|UL|ul|u|U|F|f|ll|LL|ull|ULL)?\\b"
        },
        {
                token : keywordMapper,
                regex : "[a-zA-Z_$][a-zA-Z0-9_$]*\\b"
        },
        {
            token : "string",
            regex : '"(?=.)',
            next  : "qqstring"
        }
    ],
    "qqstring": [
        {
            token: "constant.character.escape.lithp",
            regex: "\\\\."
        },
        {
            token : "string",
            regex : '[^"\\\\]+'
        }, {
            token : "string",
            regex : "\\\\$",
            next  : "qqstring"
        }, {
            token : "string",
            regex : '"|$',
            next  : "start"
        }
    ]
}

};

oop.inherits(LispHighlightRules, TextHighlightRules);

exports.LispHighlightRules = LispHighlightRules;
});

ace.define("ace/mode/lithp",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/lithp_highlight_rules"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextMode = require("./text").Mode;
var LispHighlightRules = require("./lithp_highlight_rules").LispHighlightRules;

var Mode = function() {
    this.HighlightRules = LispHighlightRules;
    this.$behaviour = this.$defaultBehaviour;
};
oop.inherits(Mode, TextMode);

(function() {
       
    this.lineCommentStart = ";";
    
    this.$id = "ace/mode/lithp";
}).call(Mode.prototype);

exports.Mode = Mode;
});
