var _this = this;
var buffer;
var exports;
WebAssembly.instantiateStreaming(fetch("main.wasm"), { env: {
        printJs: function (msg, len) {
            console.log(String.fromCharCode.apply(null, buffer.slice(msg, msg + len)));
        },
    } }).then(function (w) {
    exports = w.instance.exports;
    buffer = new Uint8ClampedArray(exports.memory.buffer);
});
var Alloc = {
    length: 0,
    alloc: function (length) {
        _this.length += length;
        return _this.length - length;
    },
};
function isType(obj) {
    return 'kind' in obj && 'data' in obj;
}
function TypeFmt(type) {
    return "Type { kind: ".concat(TypeKindFmt(type.kind), ", data: ").concat(type.data, " }");
}
function TypeFromWasm(mem) {
    var kind = getU32(mem);
    var data;
    switch (kind) {
        case TypeKind.Fn: {
            data = TypeDataFunctionFromWasm(getU32(mem + 4));
        }
    }
    return { kind: kind, data: data };
}
var TypeKind;
(function (TypeKind) {
    TypeKind[TypeKind["I64"] = 0] = "I64";
    TypeKind[TypeKind["Fn"] = 1] = "Fn";
})(TypeKind || (TypeKind = {}));
;
function TypeKindFmt(kind) {
    switch (kind) {
        case TypeKind.I64:
            return 'I64';
    }
    ;
}
function TypeDataFunctionFromWasm(mem) {
    var prmsLen = getU32(mem);
    var prms = [];
    var offset = 4;
    for (var i = 0; i < prmsLen; i++) {
        prms.push(TypeFromWasm(mem + offset));
        offset += 8;
    }
    var memory = getU32(mem + offset);
    var ty = TypeFromWasm(memory);
    return { prms: prms, ty: ty };
}
function TokenArrFromWasm(mem) {
    var memory = getU32(mem + 4);
    var length = getU32(mem);
    var slice = [];
    var offset = 0;
    for (var i = 0; i < length; i++) {
        var token = TokenFromWasm(memory + offset);
        offset += token.length();
        slice.push(token);
    }
    return { length: length, slice: slice };
}
function TokenFmt(token) {
    var DataFmt = function (data) {
        if (typeof data === 'undefined' || typeof data === 'number' || typeof data === 'string') {
            return "".concat(data);
        }
        else if (isType(data)) {
            return TypeFmt(data);
        }
        else {
            return 'undefined';
        }
    };
    return "Token { kind: ".concat(TokenKindFmt(token.kind), ", data: ").concat(DataFmt(token.data), " }");
}
function TokenFromWasm(mem) {
    var kind = getU32(mem);
    var data;
    var length = function () { return 8; };
    switch (kind) {
        case TokenKind.ty: {
            data = TypeFromWasm(mem + 4);
            break;
        }
        case TokenKind.identifier: {
            data = wasmToStr(mem + 4);
            break;
        }
        case TokenKind.integer: {
            data = getU32(mem + 4);
            break;
        }
        default:
            break;
    }
    return { kind: kind, data: data, length: length };
}
var TokenKind;
(function (TokenKind) {
    TokenKind[TokenKind["whitespace"] = 0] = "whitespace";
    TokenKind[TokenKind["fn"] = 1] = "fn";
    TokenKind[TokenKind["ret"] = 2] = "ret";
    TokenKind[TokenKind["ty"] = 3] = "ty";
    TokenKind[TokenKind["colon"] = 4] = "colon";
    TokenKind[TokenKind["semicolon"] = 5] = "semicolon";
    TokenKind[TokenKind["comma"] = 6] = "comma";
    TokenKind[TokenKind["l_paren"] = 7] = "l_paren";
    TokenKind[TokenKind["r_paren"] = 8] = "r_paren";
    TokenKind[TokenKind["plus"] = 9] = "plus";
    TokenKind[TokenKind["minus"] = 10] = "minus";
    TokenKind[TokenKind["identifier"] = 11] = "identifier";
    TokenKind[TokenKind["integer"] = 12] = "integer";
})(TokenKind || (TokenKind = {}));
;
function TokenKindFmt(kind) {
    switch (kind) {
        case TokenKind.whitespace: {
            return 'Whitespace';
        }
        case TokenKind.fn: {
            return 'Fn';
        }
        case TokenKind.ret: {
            return 'Ret';
        }
        case TokenKind.ty: {
            return 'Ty';
        }
        case TokenKind.colon: {
            return 'Colon';
        }
        case TokenKind.semicolon: {
            return 'Semicolon';
        }
        case TokenKind.comma: {
            return 'Comma';
        }
        case TokenKind.l_paren: {
            return 'LParen';
        }
        case TokenKind.r_paren: {
            return 'RParen';
        }
        case TokenKind.plus: {
            return 'Plus';
        }
        case TokenKind.minus: {
            return 'Minus';
        }
        case TokenKind.identifier: {
            return 'Identifier';
        }
        case TokenKind.integer: {
            return 'Integer';
        }
    }
}
var sourceCode = document.getElementById('sourceCode');
var compButton = document.getElementById('compButton');
compButton.addEventListener('click', function () {
    var input = sourceCode.value;
    console.log(input);
    var tokenArrMem = exports.wasmCompile(strToWasm(input), input.length);
    var tokenArr = TokenArrFromWasm(tokenArrMem);
    for (var _i = 0, _a = tokenArr.slice; _i < _a.length; _i++) {
        var token = _a[_i];
        console.log("%s", TokenFmt(token));
    }
});
function getU32(mem) {
    var num = 0;
    for (var i = 0; i < 4; i++) {
        num += buffer.at(mem + i) * Math.pow(256, i);
    }
    return num;
}
function wasmToStr(mem) {
    var memory = getU32(mem);
    var offset = 0;
    var buf = [];
    while (buffer[memory + offset]) {
        buf.push(buffer[memory + offset]);
        offset += 1;
    }
    return String.fromCharCode.apply(String, buf);
}
function strToWasm(input) {
    var ptr = Alloc.alloc(input.length);
    for (var i = 0; i < input.length; i++) {
        buffer[ptr + i] = input.codePointAt(i);
    }
    return ptr;
}
