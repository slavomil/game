

const MAX_ROWS   = 15;
const MAX_COLS   = 20;
const CELL_SIZE  = 32;
const CELL_MID   = 16;
const SHOT_OFF   = (CELL_SIZE - 24) / 2;
const fMUL       = 1.0 / CELL_SIZE;
const fSTEPS     = [ 1, CELL_SIZE - 2 ];
var  g_field     = null;
var  g_snd_food  = null;
var  g_snd_kill  = null;
let  g_run       = false;
var  g_hard_game = false;



class alienX {
	constructor(){
		this.px    = 0;
		this.py    = 0;
		this.id    = 0;
		this.index = 1;
		this.inc   = 0.0;
		this.speed = 0.3;
		this.num   = 0;
		this.path  = new array_coord(MAX_ROWS * MAX_COLS, "uint16");
	}

	updateFrame(user_x, user_y, vel){
		if(this.index >= this.num){
			if(g_run || (user_x < 0) || (user_x >= MAX_COLS) || (user_y < 0) || (user_y >= MAX_ROWS)){
				if(((this.id >>> 5) & 1) == 0){
					this.path.reverse();
					this.index = 1;
				}
				return;
			}

			let x = ((this.px + CELL_MID) * fMUL) >>> 0;
			let y = ((this.py + CELL_MID) * fMUL) >>> 0;
			if((x == user_x) && (y == user_y)){
				if(((this.id >>> 5) & 1) == 1){
					this.path.reverse();
					this.index = 1;
				}
				return;
			}

			g_run      = true;
			this.index = this.num;
			this.inc   = 0.0;

			
			this.run_find(user_x, user_y, x, y).then(() => { g_run = false; });

		} else { 

			let   x = this.path.getX(this.index - 1);
			let   y = this.path.getY(this.index - 1);
			this.px = x + (this.path.getX(this.index) - x) * this.inc;
			this.py = y + (this.path.getY(this.index) - y) * this.inc;

			this.inc += vel * this.speed;
			if(this.inc > 1.0){
				this.inc = 0.0;
				this.px  = this.path.getX(this.index);
				this.py  = this.path.getY(this.index);
				++this.index;
			}
		}
	}


	finder(user_x, user_y, x, y){
		let res = false;

		if(g_hard_game)
			res = shortest(g_field, x, y, user_x, user_y, this.path);
		else {
			switch((Math.random() * 4) >>> 0){
			case 0: 
				res = pathfind(g_field, x, y, user_x, user_y, this.path, true);
				break;
			case 1: 
				res = pathfind(g_field, x, y, user_x, user_y, this.path, false);
				break;
			default:  
				res = shortest(g_field, x, y, user_x, user_y, this.path);
				break;
			}
		}

		if(res)
			this.path.mul(CELL_SIZE);

		this.num   = this.path.size();
		this.index = 1;

	}

	async run_find(user_x, user_y, x, y) {
		return await this.finder(user_x, user_y, x, y);
	}

	put(x, y, type){
		this.px    = x;
		this.py    = y;
		this.id    = type;
		this.num   = 0;
		this.speed = (type >>> 5) * 0.05;

		if(g_hard_game)
			this.speed += 0.4;
		else
			this.speed += 0.25;
	}
}



class blockA {
	constructor(){
		this.px     = 0;
		this.py     = 0;
		this.sx     = 0;
		this.sy     = 0;
		this.index  = 1;
		this.inc    = 0.0;
		this.show   = false;
		this.tick   = 0;
		this.vel    = 0.5;
		this.sp     = new sprite();
		this.path   = new array_coord(MAX_ROWS * MAX_COLS, "uint16");
		this.parent = new matrix(MAX_ROWS, MAX_COLS, "uint16");
	}

	put(x, y, user_x, user_y){
		this.px    = x;
		this.py    = y;
		this.sx    = -200;
		this.sy    = -200;
		this.inc   = 0.0;
		this.index = 1;
		this.tick  = 0;
		this.show  = true;
		this.vel   = (g_hard_game) ? 0.6 : 0.5;
		this.sp.put(1, 4, 32, 32);
		this.sp.stop();

		let cx = ((this.px + CELL_MID) * fMUL) >>> 0;
		let cy = ((this.py + CELL_MID) * fMUL) >>> 0;

		get_shortest(g_field, cx, cy, user_x, user_y, this.parent);
		get_path(this.parent, cx, cy, user_x, user_y, this.path);
		this.path.mul(CELL_SIZE);
	}

	reset(){
		this.show = false;
	}

	update_shot(user_x, user_y, vel, tick){
		let n = this.path.size();
		if(n == 0){
			if(tick > this.tick)
				this.tick = tick;
			else {
				this.sp.updateFrame(vel, 0.8);
				if(this.sp.isStop())
					this.sx = this.sy = -200;
				return;
			}
		}

		let x, y;
		if(this.index >= n){
			if((user_x < 0) || (user_x >= MAX_COLS) || (user_y < 0) || (user_y >= MAX_ROWS))
				return;

			x = ((this.px + CELL_MID) * fMUL) >>> 0;
			y = ((this.py + CELL_MID) * fMUL) >>> 0;

			this.index = 1;
			this.inc   = 0.0;
			get_path(this.parent, x, y, user_x, user_y, this.path);
			this.path.mul(CELL_SIZE);

		} else {
			x = this.path.getX(this.index - 1);
			y = this.path.getY(this.index - 1);

			this.sx = x + (this.path.getX(this.index) - x) * this.inc + SHOT_OFF;
			this.sy = y + (this.path.getY(this.index) - y) * this.inc + SHOT_OFF;			

			this.inc += vel * this.vel;
			if(this.inc > 1.0){
				this.inc  = 0.0;
				this.sx   = this.path.getX(this.index) + SHOT_OFF;
				this.sy   = this.path.getY(this.index) + SHOT_OFF;

				if(++this.index >= n){
					this.tick = (g_hard_game) ? (tick + 1300) : (tick + 1800);
					this.sx  -= SHOT_OFF;
					this.sy  -= SHOT_OFF;
					this.path.reset();
					this.sp.play(g_state.play);
				}
			}
		}
	}

	draw_shot(hdc, shot, ialien){
		if(this.sp.isPlay())
			this.sp.draw_off(hdc, ialien, this.sx, this.sy, 0, 96);
		else if(this.path.size() > 0)
			hdc.drawImage(shot, this.sx, this.sy);
	}

	is_bullet(x, y, tick){
		if((this.path.size() > 0) && isSquareToCircle(x + 1, y + 1, CELL_SIZE - 2, this.sx + 12, this.sy + 12, 10)){
			this.tick = tick + 10000;
			this.sx  -= SHOT_OFF;
			this.sy  -= SHOT_OFF;
			this.path.reset();
			this.sp.play(g_state.play);
			return true;
		}
		return false;
	}
}



class robotUser {
	constructor(obj, cmp, bcmp){
		this.obj   = obj;
		this.pcmp  = cmp;
		this.pcmp1 = bcmp;
		this.px    = 0;
		this.py    = 0;
		this.sp    = new sprite();
		this.vel   = 10.0;
		this.bonus = 0;
		this.death = false;
		this.radius= 0.0;
		this.dir   = { right:0, left:1, down:2, up:3, state:0 };
	}

	initialize(){
		let v;
		this.bonus = 0;
		for(let i = 0; i < g_field.rows; ++i){
			for(let j = 0; j < g_field.columns; ++j){
				v = g_field.value[i][j];
				if(v == 9){
					this.px = j * CELL_SIZE;
					this.py = i * CELL_SIZE;
					g_field.value[i][j] = 0;
				} else if(v == 1)
					++this.bonus;
			}
		}
		this.dir.state = this.dir.right;
		this.sp.put(1, 4, CELL_SIZE, CELL_SIZE);
		this.sp.play(g_state.nextback_loop);
		this.death  = false;
		this.radius = 0.0;
	}

	
	key_down(code){
		switch(code){
		case 38: 
		case 87:
			this.dir.state = this.dir.up;
			break;
		case 40:
		case 83:
			this.dir.state = this.dir.down;
			break;
		case 65: 
		case 37:
			this.dir.state = this.dir.left;
			break;
		case 68: 
		case 39:
			this.dir.state = this.dir.right;
			break;
		}
	}

	
	mouse_down(x, y){
		let dx = x - (this.px + CELL_MID);
		let dy = y - (this.py + CELL_MID);
		let w  = Math.floor( Math.atan2(dy, dx) * (180.0 / Math.PI) + 90.0 );

		if((w >= 45) && (w <= 135))
			this.dir.state = this.dir.right;
		else if((w >= 136) && (w <= 225))
			this.dir.state = this.dir.down;
		else if((w >= 226) && (w <= 270) || (w <= -45))
			this.dir.state = this.dir.left;
		else
			this.dir.state = this.dir.up;
	}

	updateFrame(inf){
		if(this.death){
			if(this.radius <= CELL_SIZE)
				this.radius += inf.elapsed * 3.0;
			else
				this.radius += inf.elapsed * 19.4;

			if(this.radius > (CELL_SIZE * 11))
				return false;
		} else {
			this.sp.updateFrame(inf.elapsed, 1.2);

			
			let v = inf.elapsed * this.vel;
			switch(this.dir.state){
			case this.dir.left:
				this.px -= v;
				this.move_left();
				if(this.px <= -CELL_SIZE)
					this.px = inf.width;
				break;
			case this.dir.right:
				this.px += v;
				this.move_right();
				if(this.px >= inf.width)
					this.px = -CELL_SIZE;
				break;
			case this.dir.up:
				this.py -= v;
				this.move_up();
				if(this.py <= -CELL_SIZE)
					this.py = inf.height;
				break;
			case this.dir.down:
				this.py += v;
				this.move_down();
				if(this.py >= inf.height)
					this.py = -CELL_SIZE;
				break;
			}

		}
		return true;
	}

	move_down(){
		let row = Math.floor((this.py + CELL_SIZE - 2) * fMUL);
		if((row < 0) || (row >= MAX_ROWS))
			return;

		let col;
		for(let i = 0; i < fSTEPS.length; ++i){
			col = Math.floor((this.px + fSTEPS[i]) * fMUL);
			if((col >= 0) && (col < MAX_COLS)){
 				if(this.intersect(row, col)){
					this.py = row * CELL_SIZE - CELL_SIZE;
					return;
				}
			}
			
		}
	}

	move_up(){
		let row = Math.floor((this.py + 1) * fMUL);
		if((row < 0) || (row >= MAX_ROWS))
			return;

		let col;
		for(let i = 0; i < fSTEPS.length; ++i){
			col = Math.floor((this.px + fSTEPS[i]) * fMUL);
			if((col >= 0) && (col < MAX_COLS)){
 				if(this.intersect(row, col)){
					this.py = row * CELL_SIZE + CELL_SIZE;
					return;
				}
			}
			
		}
	}

	move_left(){
		let col = Math.floor((this.px + 1) * fMUL);
		if((col < 0) || (col >= MAX_COLS))
			return;

		let row;
		for(let i = 0; i < fSTEPS.length; ++i){
			row = Math.floor((this.py + fSTEPS[i]) * fMUL);
			if((row >= 0) && (row < MAX_ROWS)){
 				if(this.intersect(row, col)){
					this.px = col * CELL_SIZE + CELL_SIZE;
					return;
				}
			}
			
		}
	}

	move_right(){
		let col = Math.floor((this.px + CELL_SIZE - 2) * fMUL);
		if((col < 0) || (col >= MAX_COLS))
			return;

		let row;
		for(let i = 0; i < fSTEPS.length; ++i){
			row = Math.floor((this.py + fSTEPS[i]) * fMUL);
			if((row >= 0) && (row < MAX_ROWS)){
 				if(this.intersect(row, col)){
					this.px = col * CELL_SIZE - CELL_SIZE;
					return;
				}
			}
			
		}
	}

	intersect(r, c){
		let id = g_field.value[r][c];
		if(id > 1){ //блоки
			if(isSquareToSquare(this.px + 1, this.py + 1, CELL_SIZE - 2, c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE))
				return true;
		} else if(id == 1){
			if(isSquareToCircle(this.px + 1, this.py + 1, CELL_SIZE - 2, c * CELL_SIZE + CELL_MID, r * CELL_SIZE + CELL_MID, 10)){
				g_field.value[r][c] = 0;
				try {
					g_snd_food.play();
				} catch(e){
				}

				if(--this.bonus <= 0) 
					this.pcmp();
				this.pcmp1(this.bonus);
			}
		}
		return false;
	}

	set velocity(isp){
		isp = Math.max(Math.min(isp, 2), 0);
		this.vel = 10.0 + isp;
	}

	get velocity(){
		let i = 2;
		if(Math.abs(this.vel - 10.0) <= 0.05)
			i = 0;
		else if(Math.abs(this.vel - 11.0) <= 0.05)
			i = 1;
		return i;
	}

	get bonus_count(){
		return this.bonus;
	}

	kill(){
		if(!this.death){
			this.death  = true;
			this.radius = 0.0;
			try { 
				g_snd_kill.play(); 
			} catch(e){}
		}
	}

	draw(hdc){
		if(!this.death)
			this.sp.draw_off(hdc, this.obj, this.px, this.py, 0, this.dir.state * CELL_SIZE);
	}

	game_over(hdc){
		if(this.death){
			if(this.radius <= CELL_SIZE){
				hdc.drawImage(this.obj, 0, 0, CELL_MID, CELL_MID, this.px - this.radius, this.py - this.radius, CELL_MID, CELL_MID);
				hdc.drawImage(this.obj, CELL_MID, 0, CELL_MID, CELL_MID, this.px + this.radius, this.py - this.radius, CELL_MID, CELL_MID);
				hdc.drawImage(this.obj, 0, CELL_MID, CELL_MID, CELL_MID, this.px - this.radius, this.py + this.radius, CELL_MID, CELL_MID);
				hdc.drawImage(this.obj, CELL_MID, CELL_MID, CELL_MID, CELL_MID, this.px + this.radius, this.py + this.radius, CELL_MID, CELL_MID);
			} else {
				let m = this.radius - CELL_SIZE;
				hdc.fillStyle = "#000000";
				hdc.fillRect(0, 0, m, 480);
				hdc.fillRect(640 - m, 0, m, 480);
			}
		}
	}	
}



const g_levels = [
	"60000000111110000010000111030000030000000102222222A222222001000000011100030000001110000000000300000700222220000111110000000000006002222222000001111100020000000100222222002210003001000000100002000333001100000010020001110000010000000010000011002222222011022222001000209000000000010000010000011111111111",
	"1111000000100800000100100010000010001100003300333333003333000000010030000000000701100010A0001000000000333003333333333300111060000000030001000000000011110301000100333333333333300300000030010001111111110100301100000000000000333333003333333300000020002003002000000111190001030000110000000100000100011100",
	"100700011100001110000000030000000300111111044440044444444000000A01100000011040111104000011100000430000340040444444004000000400400700800040101104104001000000401000040040001104004010000400444444440043000034000011111100401000040110000001004001000444444444004440001110000030000111111100090011111000010010",
	"0600010006011001110000010010555000A5500000511100000001001110005000501100044444400050105000111060000010501050100100100111006000500050000055000001115100500011111100000050015000500001111100000050005001000000000111501150050000055500005000500501001000000000105005000000000509000011150011111100000010000110",
	"000011111070001111110022002222222222220000400001111000001000110400000100010000700A004444444444444000000004000000007000000011004001111110111100110704444440000A0000033333401111000500000000000400000005110011110100444440050011100000100400100501000333333300400005101111000900000000050000011100111111111111",
	"0080001111111111111000111000000000000308002002222002222003001020111110000020031000A2220011000120131000000200400800200300008002004000002103000000020011122220030100222211000200000300002000000002001111000020111100020000000000222222222200002220001100011110000011100000900440404040000100111110000000010100",
	"00101001600011111111111100100010000600000020020020120020020000210201201A012002107020020020120020020100200200210201210200002002702002002012010020120020020020020001200200210200200207002002102002002002100120020020120020020000200210200200210201002002012002002002000009000001111111000000000100010001000011",
	"0011110080010010001100030003100330003000055555555A5555555550007000110000001111110000300000300003010005555555555555555550002011000000010020000000006002008001110005555555555555555550100021111000002000010001100020111110002005555555555555555550000110301111010001011110003000000002230000009000011111111101",
	"0110060101111111111100A0110000010555001101444444010000010006100101040002220020000006001400120010210000444444100201002001000001000102222220001011000500010600001100000010011111111000033333001444400444010310030004006010040010001310140000001401001013010444444444000333330190000000110001001000011001111111",
	"001110011111010001070000000070010333310001110103333003003010001033330033330110011000310000000700000100103001111100022000017033010333A00001010000010030030000000000111100301300333300003333013003003103107030030030030130030000301300300300300301003003000110003003000000000900001111001101111000011110000000",
	"00011800000010010111000500A444444444401005550111000040080001050000011001400101010501100444444444400005500010001101111100800011111100000100010222211222821112222012228112222221112220021121122222111122200010000011100000010003333333333333333330000300310310300300311103013003003013003000101009001100001110",
	"0000600001111111111170000000500600A0010000055500500000003301011015005555550003000000050000010500031000310501070005003300003005555551111100110011011100500000100107000000005005555500000555550050050000101011050101500508000000000500005005555500105555550050000300110003003000000003000011110000900011000010",
	"600000111111000106000433300A00000100555014013605003333001050040130010030030000500410010010300300111104440000333073330001000100300111100333007550013080000001031000500033330110000300000011110300002013011100010003333333001100020001100001000000000200202000200200200112011029002002002100000111100111110001",
	"8001001111100000700000200200020102000201014444414444444444000020100000107000022010320011000001110021005A5555555555550001002010008000111002200320001000010000020810330133333333333300002000101080000002200320110000001100020110222222222200222210002000000050005002001020155000510050020000011110900000111111",
	"0101111110610071000110700001001011101000003333333333333333010131000000010111006010300011110000001110003074444444444400000130040000010011111080A0140010000000000811300400555555500011103104005001000000001030040050000100110700300401002222222220003000000020000101200110090100210222222000001000000100000110",
	"11100006011001111100000000200007000002080002000000020000080000001111110000000111080000002000011000001111000000700000200000200000000020111111000011000A000000000000000000200000000006002000000000110020007011110000000000000000000000000020000111000200011110000000000000000000000000200000011111009000000000",
	"00111100080011111111044444444444444444400010700050111006050000005000110005100101033333333333333333300810160000001700000110400004000400014000055555555A555555555000005000500000500111011000011111100800000222222222222222222000030030003000300010010001000011100101000333333333333333333000000090000001111000"
];
