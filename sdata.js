
function factory_array(name, num){
	let arr = null;
	switch(name.toLowerCase()){
	case "float32":
		arr = new Float32Array(num);
		break;
	case "float64":
		arr = new Float64Array(num);
		break;
	case "int8":
		arr = new Int8Array(num);
		break;
	case "int16":
		arr = new Int16Array(num);
		break;
	case "int32":
		arr = new Int32Array(num);
		break;
	case "uint8":
		arr = new Uint8Array(num);
		break;
	case "uint16":
		arr = new Uint16Array(num);
		break;
	case "uint32":
		arr = new Uint32Array(num);
		break;
	}
	return arr;
}



function stack_coord(num, type){
	this.px  = factory_array(type, num);
	this.py  = factory_array(type, num);
	this.cnt = 0;

	this.push = (x, y) => {
		if(this.cnt < this.px.length){
			this.px[this.cnt] = x;
			this.py[this.cnt] = y;
			++this.cnt;
		}
	}

	this.pop = () => {
		--this.cnt;
	}

	this.getX = () => {
		return this.px[this.cnt - 1];
	}

	this.getY = () => {
		return this.py[this.cnt - 1];
	}

	this.empty = () => {
		return (this.cnt == 0);
	}

	this.reset = () => {
		this.cnt = 0;
	}

	this.size = () => {
		return this.cnt;
	}

	this.free = () => {
		if(this.px != null){
			delete this.px;
			this.px = null;
		}

		if(this.py != null){
			delete this.py;
			this.py = null;
		}
		this.cnt = 0;
	}
}



function queue_coord(num, type){
	this.px  = factory_array(type, num);
	this.py  = factory_array(type, num);
	this.cnt = 0;

	this.push = (x, y) => {
		if(this.cnt < this.px.length){
			this.px[this.cnt] = x;
			this.py[this.cnt] = y;
			++this.cnt;
		}
	}

	this.pop = () => {
		--this.cnt;
		for(let i = 0; i < this.cnt; ++i){
			this.px[i] = this.px[i + 1];
			this.py[i] = this.py[i + 1];
		}
	}

	this.getX = () => {
		return this.px[0];
	}

	this.getY = () => {
		return this.py[0];
	}

	this.empty = () => {
		return (this.cnt == 0);
	}

	this.reset = () => {
		this.cnt = 0;
	}

	this.size = () => {
		return this.cnt;
	}

	this.free = () => {
		if(this.px != null){
			delete this.px;
			this.px = null;
		}

		if(this.py != null){
			delete this.py;
			this.py = null;
		}
		this.cnt = 0;
	}
}



function array_coord(num, type) {
	this.px  = factory_array(type, num);
	this.py  = factory_array(type, num);
	this.cnt = 0;

	this.add = (x, y) => {
		if(this.cnt < this.px.length){
			this.px[this.cnt] = x;
			this.py[this.cnt] = y;
			++this.cnt;
		}
	}

	this.reverse = () => {
		let j, t, n = this.cnt >>> 1;
		for(let i = 0; i < n; ++i){
			j = this.cnt - 1 - i;
			t = this.px[i];
			this.px[i] = this.px[j];
			this.px[j] = t;

			t = this.py[i];
			this.py[i] = this.py[j];
			this.py[j] = t;
		}
	}

	this.mul = (val) => {
		for(let i = 0; i < this.cnt; ++i){
			this.px[i] *= val;
			this.py[i] *= val;
		}
	}

	this.reset = () => {
		this.cnt = 0;
	}

	this.max_size = () => {
		return this.px.length;
	}

	this.size = () => {
		return this.cnt;
	}

	this.getX = (i) => {
		return this.px[i];
	}

	this.getY = (i) => {
		return this.py[i];
	}

	this.setX = (i, v) => {
		this.px[i] = v;
	}

	this.setY = (i, v) => {
		this.py[i] = v;
	}

	this.free = () => {
		if(this.px != null){
			delete this.px;
			this.px = null;
		}

		if(this.py != null){
			delete this.py;
			this.py = null;
		}
		this.cnt = 0;
	}
}



function priority_queue(num, cmp_fun) {
	this.arrs = [];
	this.cnt  = 0;
	this.cmp  = cmp_fun;

	num = Math.max(num, 1);
	for(let i = 0; i < num; ++i)
		this.arrs.push([]);


	this.push = (...args) => {
		if(this.arrs.length != args.length)
			return;

		for(let j = 0; j < args.length; ++j)
			this.arrs[j][this.cnt] = args[j];
		++this.cnt;

		let i = this.cnt - 1;
		let p = (i - 1) >>> 1;

		while((i > 0) && this.cmp(args[0], this.arrs[0][p])){
			this.swap(i, p);
			i = p;
			p = (p - 1) >>> 1;
		}
	}
 

	this.pop = () => {
		if(this.cnt > 0){
			this.swap(0, --this.cnt);
			this.heapify(0);
		}
	}


	this.top = (i) => {
		return this.arrs[i][0];
	}


	this.reset = () => {
		this.cnt = 0;
	}


	this.count = () => {
		return this.arrs.length;
	}

	this.size = () => {
		return this.cnt;
	}

	this.empty = () => {
		return (this.cnt == 0);
	}

	this.free = () => {
		if(this.arrs != null){
			while(this.arrs.length > 0){
				delete this.arrs[this.arrs.length - 1];
				this.arrs[this.arrs.length - 1] = null;
				this.arrs.pop();
			}
			delete this.arrs;
			this.arrs = null;
		}
		this.cnt = 0;
	}

	this.swap = (a, b) => {
		let t;
		for(let i = 0; i < this.arrs.length; ++i){
			t = this.arrs[i][a];
			this.arrs[i][a] = this.arrs[i][b];
			this.arrs[i][b] = t;
		}
	}

	this.heapify = (i) => {
		let r, l, h;
		while(true){
			l = (i << 1) + 1;
			r = l + 1;
			if((l < this.cnt) && this.cmp(this.arrs[0][l], this.arrs[0][i]))
				h = l;
			else
				h = i;

			if((r < this.cnt) && this.cmp(this.arrs[0][r], this.arrs[0][h]))
				h = r;

			if(h != i){
				this.swap(h, i);
				i = h;
			} else
				break;
		}
	}
}


class parray {
	constructor(num, name){
		this.arr    = [];
		this.shift  = factory_array("uint8", num);
		this.cnt    = 0;
		this.offset = 0;

		if((num > 0) && (name.length > 0)){

			if(name.indexOf("()") == -1)
				name = name.concat("()");
			name = "new ".concat(name);

			for(let i = 0; i < num; ++i){
				this.arr.push(eval(name));
				this.shift[i] = 0;
			}
		}
	}

	
	add(){
		for(let i = 0; i < this.arr.length; ++i){
			if(this.shift[i] == 0){
				this.shift[i] = 1;
				++this.cnt;
				return this.arr[i];
			}
		}
		return null;
	}


	remove(index){
		if(index < this.arr.length){
			if(this.shift[index] == 1){
				this.shift[index] = 0;
				--this.cnt;
			}
		}
	}


	reset() {
		for(let i = 0; i < this.arr.length; ++i)
			this.shift[i] = 0;
		this.cnt = this.offset = 0;
	}

	next(){
		let fnd = false;
		for(let i = this.offset + 1; i < this.arr.length; ++i){
			if(this.shift[i] == 1){
				this.offset = i;
				fnd = true;
				break;
			}
		}

		if(!fnd)
			this.offset = this.arr.length;		
	}

	is_next(){
		return (this.offset < this.arr.length);
	}

	get current() {
		return this.offset;
	}

	get value() {
		return this.arr[this.offset];
	}

	start() {
		for(let i = 0; i < this.arr.length; ++i){
			if(this.shift[i] == 1){
				this.offset = i;
				return;
			}
		}
		this.offset = this.arr.length;
	}

	get size() {
		return this.cnt;
	}

	free() {
		if(this.arr != null){
			let i;
			while(this.arr.length > 0){
				i = this.arr.length - 1;
				delete this.arr[i];
				this.arr[i] = null;
				this.arr.pop();
			}
			delete this.arr;
			this.arr = null;

			delete this.shift;
			this.shift = null;
		}
		this.cnt = this.offset = 0;
	}
}



class matrix {
	constructor(rows, cols, type){
		if((rows <= 0) || (cols <= 0) || ((type == null) || (type.length <= 3)))
			return;

		this.mat = [];
		for(let i = 0; i < rows; ++i){
			let arr = factory_array(type, cols);
			if(arr == null){
				this.free();
				throw new TypeError("no array");
			}
			this.mat.push(arr);
		}
	}


	parse(str){
		let c = this.columns;
		if(str.length != (this.rows * c))
			return false;

		const _0 = '0'.charCodeAt(0);
		const _A = 'A'.charCodeAt(0);

		let x, ch;
		for(let i = 0; i < str.length; ++i){
			ch = str.charAt(i);
			if(ch >= '0' && ch <= '9')
				x = str.charCodeAt(i) - _0;
			else if(ch >= 'A' && ch <= 'Z')
				x = str.charCodeAt(i) - _A + 10;
			else
				x = 0;

			this.mat[(i / c) >>> 0][i % c] = x;
		}
		return true;
	}


	set fill(val){
		for(let i = 0; i < this.mat.length; ++i){
			for(let j = 0; j < this.mat[i].length; ++j)
				this.mat[i][j] = val;
		}
	}


	reverse_columns(){
		let k, t, n = this.columns >>> 1;
		for(let i = 0; i < this.mat.length; ++i){
			for(let j = 0; j < n; ++j){
				k = this.mat[i].length - 1 - j;
				t = this.mat[i][j];
				this.mat[i][j] = this.mat[i][k];
				this.mat[i][k] = t;
			}
		}
	}


	reverse_rows(){
		let n = this.mat.length;
		let m = n >>> 1;		
		for(let i = 0; i < m; ++i){
			let t = this.mat[i];
			this.mat[i] = this.mat[n - 1 - i];
			this.mat[n - 1 - i] = t;
		}
	}

	get value(){
		return this.mat;
	}

	get columns(){
		return this.mat[0].length;
	}


	get rows(){
		return this.mat.length;
	}


	free(){
		if(this.mat != null){
			while(this.mat.length > 0){
				delete this.mat[this.mat.length - 1];
				this.mat[this.mat.length - 1] = null;
				this.mat.pop();
			}
			delete this.mat;
			this.mat = null;
		}
	}
}
