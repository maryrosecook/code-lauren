ace.define("ace/theme/lauren",["require","exports","module","ace/lib/dom"], function(acequire, exports, module) {

exports.isDark = false;
exports.cssClass = "ace-lauren";
exports.cssText = ".ace-lauren .ace_gutter {\
background: #FFFFFF;\
color: rgb(255, 255, 255)\
}\
.ace-lauren .ace_print-margin {\
width: 1px;\
background: #ffffff\
}\
.ace-lauren {\
background-color: #002240;\
color: #FFFFFF\
}\
.ace-lauren .ace_marker-layer .ace_selection {\
background: rgba(200, 200, 255, 0.75)\
}\
.ace-lauren.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #002240;\
border-radius: 2px\
}\
.ace-lauren .ace_marker-layer .ace_step {\
background: rgb(127, 111, 19)\
}\
.ace-lauren .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid rgba(255, 255, 255, 0.15)\
}\
.ace-lauren .ace_marker-layer .ace_active-line {\
background: rgba(0, 0, 0, 0.35)\
}\
.ace-lauren .ace_gutter-active-line {\
background-color: rgba(0, 0, 0, 0.35)\
}\
.ace-lauren .ace_marker-layer .ace_selected-word {\
border: 1px solid rgba(179, 101, 57, 0.75)\
}\
.ace-lauren .ace_invisible {\
color: rgba(255, 255, 255, 0.15)\
}\
.ace-lauren .ace_keyword,\
.ace-lauren .ace_meta {\
color: #F2A844\
}\
.ace-lauren .ace_constant,\
.ace-lauren .ace_constant.ace_character,\
.ace-lauren .ace_constant.ace_character.ace_escape,\
.ace-lauren .ace_constant.ace_other {\
color: #FF5BAE\
}\
.ace-lauren .ace_invalid {\
color: #F8F8F8;\
background-color: #800F00\
}\
.ace-lauren .ace_support {\
color: #80FFBB\
}\
.ace-lauren .ace_support.ace_constant {\
color: #EB5B5A\
}\
.ace-lauren .ace_fold {\
background-color: #FF9D00;\
border-color: #FFFFFF\
}\
.ace-lauren .ace_support.ace_function {\
color: #4A9CC9\
}\
.ace-lauren .ace_storage {\
color: #FFEE80\
}\
.ace-lauren .ace_entity {\
color: #FFDD00\
}\
.ace-lauren .ace_string {\
color: #578622\
}\
.ace-lauren .ace_string.ace_regexp {\
color: #80FFC2\
}\
.ace-lauren .ace_comment {\
font-style: italic;\
color: #0088FF\
}\
.ace-lauren .ace_heading,\
.ace-lauren .ace_markup.ace_heading {\
color: #C8E4FD;\
background-color: #001221\
}\
.ace-lauren .ace_list,\
.ace-lauren .ace_markup.ace_list {\
background-color: #130D26\
}\
.ace-lauren .ace_variable {\
color: #CCCCCC\
}\
.ace-lauren .ace_variable.ace_language {\
color: #FF80E1\
}\
.ace-lauren .ace_meta.ace_tag {\
color: #9EFFFF\
}\
.ace-lauren .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWNgYGBgYHCLSvkPAAP3AgSDTRd4AAAAAElFTkSuQmCC) right repeat-y\
}";

var dom = acequire("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
