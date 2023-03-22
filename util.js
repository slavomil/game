
const g_state = {
	stop:0,
	play:1,
	loop:2,
	back:3,
	loopback:4,
	nextback:5,
	nextback_loop:6
}



function sprite() {
	this.inc   = 0.0;
	this.px    = 0;
	this.py    = 0;
	this.sizey = 0;
	this.sizex = 0;
	this.cx    = 0;
	this.cy    = 0;
	this.state = g_state.stop;

	this.put = (rows, cols, cx, cy) => {
		this.sizey = rows * cy;
		this.sizex = cols * cx;
		this.cx    = cx;
		this.cy    = cy;
	}

	this.play = (mode) => {
		this.inc   = 0.0;
		this.px    = 0;
		this.py    = 0;
		this.state = mode;

		switch(mode){
		case g_state.back:
		case g_state.loopback:
			this.px = this.sizex - this.cx;
			this.py = this.sizey - this.cy;
			break;
		}
	}

	this.stop = () => {
		this.state = g_state.stop;
	}

	this.draw = (hdc, img, x, y) => {
		hdc.drawImage(img, this.px, this.py, this.cx, this.cy, x, y, this.cx, this.cy);
	}

	this.draw_off = (hdc, img, x, y, ox, oy) => {
		hdc.drawImage(img, ox + this.px, oy + this.py, this.cx, this.cy, x, y, this.cx, this.cy);		
	}

	this.draw_s = (hdc, img, x, y, w, h) => {
		hdc.drawImage(img, this.px, this.py, this.cx, this.cy, x, y, w, h);
	}

	this.draw_s_off = (hdc, img, x, y, w, h, ox, oy) => {
		hdc.drawImage(img, ox + this.px, oy + this.py, this.cx, this.cy, x, y, w, h);		
	}

	this.updateFrame = (ft, vel) => {
		let st = this.state & 0xFF;

		switch(st){
		case g_state.play:
		case g_state.loop:
			this.inc += ft * vel;
			if(this.inc < 1.0)
				break;
			this.inc = 0.0;

			this.px += this.cx;
			if(this.px >= this.sizex){
				this.px = 0;
				this.py += this.cy;
				if(this.py >= this.sizey){
					this.py = 0;
					if(st == g_state.play)
						this.stop();
				}
			}
			break;
		case g_state.back:
		case g_state.loopback:
			this.inc += ft * vel;
			if(this.inc < 1.0)
				break;
			this.inc = 0.0;

			this.px -= this.cx;
			if(this.px < 0){
				this.px = this.sizex - this.cx;
				this.py -= this.cy;
				if(this.py < 0){
					this.py = this.sizey - this.cy;
					if(st == g_state.back)
						this.stop();
				}
			}
			break;
		case g_state.nextback:
		case g_state.nextback_loop:
			this.inc += ft * vel;
			if(this.inc < 1.0)
				break;
			this.inc = 0.0;

			if((this.state & 0x800) == 0){
				this.px += this.cx;
				if(this.px >= this.sizex){
					this.px = 0;
					this.py += this.cy;
					if(this.py >= this.sizey){
						this.px     = this.sizex - (this.cx << 1);
						this.py     = this.sizey - this.cy;
						this.state |= 0x800;
					}
				}
			} else {
				this.px -= this.cx;
				if(this.px < 0){
					this.px = this.sizex - this.cx;
					this.py -= this.cy;
					if(this.py < 0){
						this.py = this.sizey - this.cy;
						if(st == g_state.nextback){
							this.px = this.py = 0;
							this.stop();
						} else {
							this.px     = this.cx;
							this.py     = 0;
							this.state &= ~0x800;
						}
					}
				}
			}
			break;
		}
	}

	this.isPlay = () => {
		return ((this.state & 0xFF) != g_state.stop);
	}

	this.isStop = () => {
		return ((this.state & 0xFF) == g_state.stop);
	}
}



const g_dirs = [ [0,1],[1,0],[-1,0],[0,-1] ];
var g_parent = null;
var g_maze   = null;
var g_queue  = null;
var g_stack  = null;
var g_pqu    = null;



function create_sdata(rows, cols){
	g_parent = new matrix(rows, cols, "uint16");
	g_maze   = new matrix(rows, cols, "uint16");
	g_queue  = new queue_coord(rows * cols, "uint8");
	g_stack  = new stack_coord(rows * cols, "uint8");
	g_pqu    = new priority_queue(3, (x, y) => { return x > y; });
}


function pathfind(field, user_col, user_row, col, row, path, LIFO){
	g_maze.fill   = 0xFFFF;
	g_parent.fill = 0;
	g_maze.value[user_row][user_col] = 0;

	let sq = (LIFO == true) ? g_stack : g_queue;
	sq.reset();
	sq.push(user_col, user_row);

	let fnd = false;
	let cx, cy, x, y;
	while(!sq.empty()){
		cx = sq.getX();
		cy = sq.getY();
		sq.pop();

		if((cx == col) && (cy == row))
			fnd = true;

		for(let i = 0; i < g_dirs.length; ++i){
			x = cx + g_dirs[i][0];
			y = cy + g_dirs[i][1];
			if((x < 0) || (y < 0) || (x >= field.columns) || (y >= field.rows) || (field.value[y][x] > 1))
				continue;

			if(g_maze.value[y][x] > (g_maze.value[cy][cx] + 1)){
				g_parent.value[y][x] = (cx << 8) | cy;
				g_maze.value[y][x]   = g_maze.value[cy][cx] + 1;
				sq.push(x, y);
			}
		}

		if(fnd)
			break;
	}

	if(fnd){
		path.reset();
		path.add(col, row);
		while((user_col != col) || (user_row != row)){
			x = g_parent.value[row][col] >>> 8;
			y = g_parent.value[row][col] & 0xFF;
			path.add(x, y);
			col = x;
			row = y;
		}
	}
	path.reverse();
	return fnd;
}



function dist_coord(x1, y1, x2, y2) {
	return (Math.abs(x2 - x1) + Math.abs(y2 - y1)) * 10;
}


function shortest(field, user_col, user_row, col, row, path){
	g_parent.fill = 0;
	g_maze.fill   = 0xFFFF;

	let d = dist_coord(user_col, user_row, col, row);	
	g_maze.value[user_row][user_col] = d;

	g_pqu.reset();
	g_pqu.push(d, user_col, user_row);

	let fnd = false;
	let x, y, cx, cy;
	while(!g_pqu.empty()){
		d  = g_pqu.top(0);
		cx = g_pqu.top(1);
		cy = g_pqu.top(2);
		g_pqu.pop();

		if((cx == col) && (cy == row)){
			fnd = true;
			break;
		} else if(d > g_maze.value[cy][cx])
			continue;

		for(let i = 0; i < g_dirs.length; ++i){
			x = cx + g_dirs[i][0];
			y = cy + g_dirs[i][1];
			if((x < 0) || (y < 0) || (x >= field.columns) || (y >= field.rows) || (field.value[y][x] > 1))
				continue;

			d = dist_coord(x, y, col, row);
			if(g_maze.value[y][x] > (g_maze.value[cy][cx] + d)){
				g_parent.value[y][x] = (cx << 8) | cy;
				g_maze.value[y][x]   = g_maze.value[cy][cx] + d;
				g_pqu.push(d, x, y);
			}
		}
	}

	if(fnd){
		path.reset();
		path.add(col, row);
		while((user_col != col) || (user_row != row)){
			x = g_parent.value[row][col] >>> 8;
			y = g_parent.value[row][col] & 0xFF;
			path.add(x, y);
			col = x;
			row = y;
		}
	}
	path.reverse();
	return fnd;
}


function get_shortest(field, col, row, col1, row1, parent){
	g_pqu.reset();
	parent.fill = 0;
	g_maze.fill = 0xFFFF;

	let d = dist_coord(col, row, col1, row1);	
	g_maze.value[row][col] = d;

	g_pqu.reset();
	g_pqu.push(d, col, row);

	let x, y, cx, cy;
	while(!g_pqu.empty()){
		d  = g_pqu.top(0);
		cx = g_pqu.top(1);
		cy = g_pqu.top(2);
		g_pqu.pop();

		if(d > g_maze.value[cy][cx])
			continue;

		for(let i = 0; i < g_dirs.length; ++i){
			x = cx + g_dirs[i][0];
			y = cy + g_dirs[i][1];
			if((x < 0) || (y < 0) || (x >= field.columns) || (y >= field.rows) || (field.value[y][x] > 1))
				continue;

			d = dist_coord(x, y, col1, row1);
			if(g_maze.value[y][x] > (g_maze.value[cy][cx] + d)){
				parent.value[y][x] = (cx << 8) | cy;
				g_maze.value[y][x] = g_maze.value[cy][cx] + d;
				g_pqu.push(d, x, y);
			}
		}
	}
}



function get_path(parent, col, row, col1, row1, path){
	let x, y;
	path.reset();
	path.add(col1, row1);
	while((col != col1) || (row != row1)){
		x = parent.value[row1][col1] >>> 8;
		y = parent.value[row1][col1] & 0xFF;
		path.add(x, y);
		col1 = x;
		row1 = y;
	}
	path.reverse();
}


function fillCanvas(hdc, px, py, width, height, img, ox, oy, w, h){
	let mx = width  % w;
	let my = height % h;

	width  += px;
	height += py;
	let cx = width;
	let cy = height;

	if(mx > 0)
		cx -= w;
	if(my > 0)
		cy -= h;

	let x, y = py;
	for(; y < cy; y += h){
		x = px;
		for(; x < cx; x += w)
			hdc.drawImage(img, ox, oy, w, h, x, y, w, h);

		if(x < width)
			hdc.drawImage(img, ox, oy, mx, h, x, y, mx, h);
	}

	if(y < height){
		for(x = px; x < cx; x += w)
			hdc.drawImage(img, ox, oy, w, my, x, y, w, my);

		if(x < width)
			hdc.drawImage(img, ox, oy, mx, my, x, y, mx, my);
	}
}



function isSquareToSquare(x1, y1, size1, x2, y2, size2){
	let r1 = x1 + size1;
	let b1 = y1 + size1;
	let r2 = x2 + size2;
	let b2 = y2 + size2;
	return (x1 < r2) && (x2 < r1) && (y1 < b2) && (y2 < b1);
}


function isSquareToCircle(rx, ry, s, cx, cy, r){
	let x = cx;
	let y = cy;
	if(x < rx)
		x = rx;
	else if(x > (rx + s))
		x = rx + s;

	if(y < ry)
		y = ry;
	else if(y > (ry + s))
		y = ry + s;

	x = cx - x;
	y = cy - y;
	return ((x*x+y*y) <= (r*r));
}



function isPointToRect(x, y, rx, ry, w, h){
	return ((x > rx) && (x < (rx + w)) && (y > ry) && (y < (ry + h)));
}


function getCookieLevel(){
	try {
		let s = document.cookie.match(/(level\=)\d+/);
		if((s == null) || (s.length == 0))
			return 0;
		return parseInt(s[0].substring(6, s[0].length));
	} catch(e){}
	return 0;
}


function putCookieLevel(level){
	if(typeof(document.cookie) != "undefined")
		document.cookie = "level=" + level;
}


function objAt(name){
	if(typeof(document.getElementById) != "undefined")
		return document.getElementById(name);
	return document.all[name];
}


function setText(o, s){
	if(o.innerText)
		o.innerText = s;
	else
		o.innerHTML = s;
}


function change(i){
	let o = objAt(i);
	if((typeof(o) != "undefined") && (typeof(o.checked) != "undefined"))
		o.checked = true;
}
