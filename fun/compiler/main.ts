let buffer: Uint8ClampedArray;
let exports;
WebAssembly.instantiateStreaming(fetch("main.wasm"), { env: {
    printJs: (msg, len) => {
        console.log(String.fromCharCode.apply(null, buffer.slice(msg, msg+len)));
    },
} }).then((w) => {
    exports = w.instance.exports;
    buffer = new Uint8ClampedArray(exports.memory.buffer);
});

let Alloc = {
    length:  0,
    alloc: (length: number): number => {
        this.length += length;
        return this.length - length;
    },
};

type Type = {
    kind: TypeKind,
};

function isType(obj: any): obj is Type {
    return 'kind' in obj && 'data' in obj;
}

function TypeFmt(type: Type): string {
    return `Type { kind: ${TypeKindFmt(type.kind)} }`;
}

function TypeFromWasm(mem: number): Type {
    const kind = getU32(mem);
    return { kind: kind };
}

enum TypeKind {
    I64,
};

function TypeKindFmt(kind: TypeKind): string {
    switch (kind) {
        case TypeKind.I64:
            return 'I64';
    };
}

type TokenArr = {
    length: number,
    slice: Token[],
};

function TokenArrFromWasm(mem: number): TokenArr {
    const memory = getU32(mem+4);
    const length: number = getU32(mem);
    let slice: Token[] = [];
    let offset = 0;

    for (let i = 0; i < length; i++) {
        const token = TokenFromWasm(memory+offset);
        offset += token.length();
        slice.push(token);
    }
    return { length: length, slice: slice };
}

type Token = {
    kind: TokenKind,
    data: void | number | string | Type,

    length: () => number,
};

function TokenFmt(token: Token): string {
    const DataFmt = (data: Token['data']) => {
        if (typeof data === 'undefined' || typeof data === 'number' || typeof data === 'string') {
            return `${data}`;
        } else if (isType(data)) {
            return TypeFmt(data);
        } else {
            return 'undefined';
        }
    };

    return `Token { kind: ${TokenKindFmt(token.kind)}, data: ${DataFmt(token.data)} }`;
}

function TokenFromWasm(mem: number): Token {
    const kind: number = getU32(mem);
    let data: Token['data'];
    const length: () => number = () => 8;
    switch (kind) {
        case TokenKind.ty: {
            data = TypeFromWasm(mem+4);
            break;
        }
        case TokenKind.identifier: {
            data = wasmToStr(mem+4);
            break;
        }
        case TokenKind.integer: {
            data = getU32(mem+4);
            break;
        }
        default:
            break;
    }
    return { kind: kind, data: data, length: length };
}

enum TokenKind {
    whitespace,
    fn,
    ret,
    ty,
    colon,
    semicolon,
    comma,
    l_paren,
    r_paren,
    plus,
    minus,
    identifier,
    integer,
};

function TokenKindFmt(kind: TokenKind): string {
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

let sourceCode = document.getElementById('sourceCode') as HTMLTextAreaElement;
let compButton = document.getElementById('compButton');
compButton.addEventListener('click', () => {
    const input: string = sourceCode.value;
    console.log(input);
    const tokenArrMem = exports.wasmCompile(strToWasm(input), input.length);
    const tokenArr = TokenArrFromWasm(tokenArrMem);
    for (const token of tokenArr.slice) {
        console.log("%s", TokenFmt(token));
    }
});

function getU32(mem: number): number {
    let num = 0;
    for (let i = 0; i < 4; i++) {
        num += buffer.at(mem+i) * Math.pow(256, i);
    }
    return num;
}

function wasmToStr(mem: number): string {
    const memory = getU32(mem);
    let offset: number = 0;
    let buf: number[] = [];
    while (buffer[memory+offset]) {
        buf.push(buffer[memory+offset]);
        offset += 1;
    }
    return String.fromCharCode(...buf);
}

function strToWasm(input: string): number {
    const ptr = Alloc.alloc(input.length);
    for (let i = 0; i < input.length; i++) {
        buffer[ptr+i] = input.codePointAt(i);
    }
    return ptr;
}
