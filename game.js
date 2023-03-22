

var g_inf = {
	timer:null,
	hdc:null,
	mdc:null,
	elapsed:0.0,
	tick:0,
	width:640,
	height:480,
	buffer:null,
	floor:null,
	cback:null,
	hback:null,
	blocks:null,
	bonus:null,
	title:null,
	cbonus:null,
	clevel:null,
	bar:null,
	bullet:null
}

var g_status = {
	MENU:0, LEVEL:1, GAME:2, OVER:3, FINISH:4, PAUSE:5, HELP:6, state:0
}

let g_user   = null;
let g_aliens = null;
let g_blockA = null;
let g_ialien = null;
let g_sp_aliens = null;
let g_sp_bonus = null;
let  g_level  = 0;
let g_select  = 0;
let g_alpha   = 0.0;
let g_prev_st = -1;
const sButton = { cx:300, cy:50 };
const fBONUS  = (CELL_SIZE - 20) / 2;


function init_game(){
	g_sp_aliens.put(1, 4, CELL_SIZE, CELL_SIZE);
	g_sp_aliens.play(g_state.nextback_loop);

	g_sp_bonus.put(6, 5, 20, 20);
	g_sp_bonus.play(g_state.loop);

	fillCanvas(g_inf.hback, 0, 0, g_inf.cback.width, g_inf.cback.height, g_inf.floor, g_level % 2 * 128, 0, 128, 128);

	g_field.parse(g_levels[g_level]);
	g_user.initialize();

	let id, p;
	g_aliens.reset();
	g_blockA.reset();
	for(let i = 0; i < g_field.rows; ++i){
		for(let j = 0; j < g_field.columns; ++j){
			id = g_field.value[i][j];
			if((id >= 6) && (id <= 8)){
				p = g_aliens.add();
				if(p != null)
					p.put(j * CELL_SIZE, i * CELL_SIZE, (id - 6) * CELL_SIZE);
				g_field.value[i][j] = 0;
			} else if(id == 10){ 
				if(!g_blockA.show)
					g_blockA.put(j * CELL_SIZE, i * CELL_SIZE, Math.floor((g_user.px + CELL_MID) * fMUL), Math.floor((g_user.py + CELL_MID) * fMUL));				
			}
		}
	}
	g_status.state = g_status.LEVEL;
	g_alpha = 1.0;

	g_inf.bar.style.visibility = "visible";
	setText(g_inf.cbonus, "bonuses: " + g_user.bonus_count);
	setText(g_inf.clevel, "level: " + (g_level + 1));
}


function update_game(){
	if(!g_user.updateFrame(g_inf)){
		g_status.state = g_status.OVER;
		return;
	}

	g_sp_aliens.updateFrame(g_inf.elapsed, 0.8);
	g_sp_bonus.updateFrame(g_inf.elapsed, 2.2);

	let x = Math.floor((g_user.px + CELL_MID) * fMUL);
	let y = Math.floor((g_user.py + CELL_MID) * fMUL);

	g_aliens.start();
	while(g_aliens.is_next()){
		g_aliens.value.updateFrame(x, y, g_inf.elapsed);
		if(isSquareToSquare(g_user.px + 1, g_user.py + 1, CELL_SIZE - 2, g_aliens.value.px, g_aliens.value.py, CELL_SIZE)){
			g_user.kill();
			break;
		}
		g_aliens.next();
	}

	if(g_blockA.show){
		g_blockA.update_shot(x, y, g_inf.elapsed, g_inf.tick);
		if(g_blockA.is_bullet(g_user.px, g_user.py, g_inf.tick)){
			g_user.kill();
		}
	}
}


function render_game(){
	g_inf.mdc.drawImage(g_inf.cback, 0, 0);

	let id, x, y;
	for(let i = 0; i < g_field.rows; ++i){
		for(let j = 0; j < g_field.columns; ++j){
			id = g_field.value[i][j];
			if(id == 0)
				continue;

			x = j * CELL_SIZE;
			y = i * CELL_SIZE;

			if((id >= 2) && (id <= 5)){
				id = (id - 2) * CELL_SIZE;
				g_inf.mdc.drawImage(g_inf.blocks, id, 0, CELL_SIZE, CELL_SIZE, x, y, CELL_SIZE, CELL_SIZE);
			} else if(id == 1)
				g_sp_bonus.draw(g_inf.mdc, g_inf.bonus, x + fBONUS, y + fBONUS);
		}
	}

	let p;
	g_aliens.start();
	while(g_aliens.is_next()){
		p = g_aliens.value;
		g_sp_aliens.draw_off(g_inf.mdc, g_ialien, p.px, p.py, 0, p.id);
		g_aliens.next();
	}
	g_user.draw(g_inf.mdc);

	if(g_blockA.show){
		g_sp_aliens.draw_off(g_inf.mdc, g_ialien, g_blockA.px, g_blockA.py, 0, 128);
		g_blockA.draw_shot(g_inf.mdc, g_inf.bullet, g_ialien);
	}
	g_user.game_over(g_inf.mdc);
}

function mouse_down(e){
	if(g_status.state == g_status.GAME)
		g_user.mouse_down(e.offsetX, e.offsetY);
	else
		menu_down(e.offsetX, e.offsetY);
}

function key_down(e){
	if(g_status.state == g_status.GAME){
		if(e.keyCode == 27)
			g_status.state = g_status.PAUSE;
		else		
			g_user.key_down(e.keyCode);
	} else
		menu_key(e.keyCode);
}

function update_frame(){
	switch(g_status.state){
	case g_status.GAME:
		update_game();
		break;
	case g_status.LEVEL:
		update_level();
		break;
	}
}

function render(){
	switch(g_status.state){
	case g_status.GAME:
		render_game();
		break;
	case g_status.LEVEL:
		render_level();
		break;
	case g_status.HELP:
		render_help();
		break;
	default:
		render_menu();
		break;
	}
}

function getTickCount(){
	let d = new Date();
	let m = d.getTime();
	delete d;
	d = null;
	return m;
}

function game_create(msec){
	let ob    = document.createElement("canvas");
	ob.width  = 640;
	ob.height = 480;

	let oc = objAt("field");
	g_inf.hdc      = oc.getContext("2d");
	oc.onmousedown = mouse_down;
	oc.onmousemove = mouse_move;

	g_inf.tick    = getTickCount();
	g_inf.elapsed = 0.0;
	g_inf.mdc     = ob.getContext("2d");
	g_inf.buffer  = ob;
	g_inf.width   = ob.width  >>> 0;
	g_inf.height  = ob.height >>> 0;
	g_inf.blocks  = objAt("blocks");
	g_inf.bonus   = objAt("bonus");
	g_inf.title   = objAt("title");
	g_inf.cbonus  = objAt("cbonus");
	g_inf.clevel  = objAt("clevel");
	g_inf.bar     = objAt("bar");
	g_inf.bullet  = objAt("bullet");

	g_field = new matrix(MAX_ROWS, MAX_COLS, "uint8");
	g_field.fill = 0;

	create_sdata(MAX_ROWS, MAX_COLS);

	g_inf.floor  = objAt("floor");
	g_inf.cback  = document.createElement("canvas");
	g_inf.cback.width  = g_inf.width;
	g_inf.cback.height = g_inf.height;
	g_inf.hback = g_inf.cback.getContext("2d");

	g_aliens = new parray(8, "alienX");
	g_blockA = new blockA();

	g_user = new robotUser(objAt("user"), () => { 
		if(++g_level >= g_levels.length){
			g_level = 0;
			g_inf.bar.style.visibility = "hidden";
			g_status.state = g_status.FINISH;
		} else
			init_game();

		g_inf.clevel.innerText = "level: " + (g_level + 1);
		putCookieLevel(g_level);
	}, 
	(n) => {
		setText(g_inf.cbonus, "orbs: " + n);				
	});

	g_ialien    = objAt("aliens");
	g_sp_aliens = new sprite();
	g_sp_bonus  = new sprite();

	try {
		g_snd_food = new Audio("sound/food.wav");
		g_snd_kill = new Audio("sound/boom.wav");
	} catch(e){}

	window.onkeydown = key_down;
	g_status.state = g_status.MENU;

	g_level     = getCookieLevel();
	g_inf.timer = setInterval(event_time, msec);
}

function event_time(){
	let s = getTickCount();
	let m = s - g_inf.tick;

	g_inf.tick = s;
	if(m > 0){
		g_inf.elapsed = m * 0.01;
		update_frame();
	}
	render();
	g_inf.hdc.drawImage(g_inf.buffer, 0, 0);
}

function config_run(){
	objAt("field").style.visibility = "hidden";

	change((!g_hard_game) ? "hard1" : "hard2");
	change("vel" + g_user.velocity);

	let p = objAt("cpanel");
	p.style.left = Math.floor((screen.width  - 350) / 2) + "px";
	p.style.top  = Math.floor((screen.height - 270) / 2 - 80) + "px";
	p.style.visibility = "visible";
}

function config_cancel(){
	objAt("cpanel").style.visibility = "hidden";
	objAt("field").style.visibility = "visible";
}

function config_good(){
	g_hard_game = objAt("hard2").checked;

	for(let i = 0; i < 3; ++i){
		if(objAt("vel" + i).checked){
			g_user.velocity = i;
			break;
		}
	}
	config_cancel();
}


function exec_command(cmd){
	g_prev_st = -1;
	g_select  = 0;
	switch(g_status.state){
	case g_status.MENU:
		if(cmd == 0)
			init_game();
		else if(cmd == 1)
			g_status.state = g_status.HELP;
		break;
	case g_status.PAUSE:
		if(cmd == 0){
			g_inf.tick = getTickCount();
			g_status.state = g_status.GAME;
		} else if(cmd == 1)
			show_menu();
		break;
	case g_status.FINISH:
	case g_status.OVER:
		if(cmd == 0)
			init_game();			
		else if(cmd == 1)
			show_menu();
		break;
	case g_status.HELP:
		if(cmd == 0)
			config_run();
		else if(cmd == 1)
			show_menu();
		break;
	}
}

function show_menu(){
	g_inf.bar.style.visibility = "hidden";
	setText(g_inf.cbonus, "");
	setText(g_inf.clevel, "");
	g_status.state = g_status.MENU;
}

function render_menu(){
	switch(g_status.state){
	case g_status.MENU:
		put_menu("Simplegame", "#ffaa55", "#aa5511", "Start");
		{
			g_inf.mdc.fillStyle = "#55ccff";
			g_inf.mdc.font = "18px Tahoma";
			const s = "Collect the bonuses";
			g_inf.mdc.fillText(s, (g_inf.width - g_inf.mdc.measureText(s).width)/2, 275);
		}
		break;
	case g_status.PAUSE:
		put_menu("Stop", "#00ff55", "#00aa22", "Continue", "Menu");
		break;
	case g_status.FINISH:
		put_menu("You are the best", "#ff00ff", "#aa00aa", "Restart", "Main menu");
		break;
	case g_status.OVER:
		put_menu("You lose", "#ff0000", "#aa0000", "Restart", "Main Menu");
		break;
	}
}


function render_level(){
	render_game();
	g_inf.mdc.globalAlpha = g_alpha;
	g_inf.mdc.fillStyle = "#000000";
	g_inf.mdc.fillRect(0, 0, g_inf.width, g_inf.height);
	g_inf.mdc.globalAlpha = 1.0;

	let str = "Level - " + (g_level + 1);
	g_inf.mdc.font = "20px Tahoma";
	g_inf.mdc.fillStyle = "#ffffff";
	g_inf.mdc.fillText(str, (g_inf.width - g_inf.mdc.measureText(str).width)/2, g_inf.height / 2 - 10);
}





function update_level(){
	g_alpha -= g_inf.elapsed * 0.08;
	if(g_alpha < 0.0){
		g_alpha = 1.0;
		g_status.state = g_status.GAME;
		g_inf.mdc.globalAlpha = 1.0;
	}
}


function put_menu(cap, color1, color2, ...args){
	if(g_status.state != g_prev_st){
		g_inf.mdc.fillStyle = "#000000";
		g_inf.mdc.fillRect(0, 0, g_inf.width, g_inf.height);

		let left;
		switch(g_status.state){
		case g_status.OVER:
		case g_status.PAUSE:
			left = 64;
			break;
		default:
			left = 0;
			break;
		}
		fillCanvas(g_inf.mdc, 0, 314, g_inf.width, 150, g_inf.blocks, left, 32, 64, 64);

		g_inf.mdc.drawImage(g_inf.title, (g_inf.width - g_inf.title.width)/2, 10);

		g_inf.mdc.font = "32px Tahoma";

		left = (g_inf.width - g_inf.mdc.measureText(cap).width)/2; 
		g_inf.mdc.fillStyle = color1;
		g_inf.mdc.fillText(cap, left, 117);

		g_inf.mdc.strokeStyle = color2;
		g_inf.mdc.strokeText(cap, left, 117);

		g_prev_st = g_status.state;
	}
	draw_button(...args);
}


function draw_button(...args){
	let top  = (g_inf.height >>> 1) + 90;
	let left = (g_inf.width - sButton.cx) >>> 1;

	g_inf.mdc.font = "20px Tahoma";

	let pos;
	for(let i = 0; i < args.length; ++i, top += sButton.cy + 20){
		if(i == g_select){
			pos = 150 + 115 * Math.sin(g_inf.tick * 0.008);
			g_inf.mdc.fillStyle = "rgb(0, 0, " + Math.trunc(pos) + ")";
		} else
			g_inf.mdc.fillStyle = "#116633";

		g_inf.mdc.fillRect(left, top, sButton.cx, sButton.cy);

		if(i == g_select){
			g_inf.mdc.strokeStyle = "#9999aa";
			g_inf.mdc.strokeRect(left + 1, top + 1, sButton.cx - 2, sButton.cy - 2);
		}
		g_inf.mdc.fillStyle = (i == g_select) ? "#ffffff" : "#ffaa00";
		g_inf.mdc.fillText(args[i], (g_inf.width - g_inf.mdc.measureText(args[i]).width)/2, top + 32);
	}
}



function mouse_move(e){
	if(g_status.state != g_status.GAME){
		let top  = (g_inf.height >>> 1) + 90;
		let left = (g_inf.width - sButton.cx) >>> 1;
		for(let i = 0; i < 2; ++i, top += sButton.cy + 20){
			if(isPointToRect(e.offsetX, e.offsetY, left, top, sButton.cx, sButton.cy))
				g_select = i;
		}
	}
}


function menu_down(x, y){
	let top  = (g_inf.height >>> 1) + 90;
	let left = (g_inf.width - sButton.cx) >>> 1;
	for(let i = 0; i < 2; ++i, top += sButton.cy + 20){
		if(isPointToRect(x, y, left, top, sButton.cx, sButton.cy)){
			exec_command(i);
			break;
		}
	}	
}


function menu_key(key){
	switch(key){
	case 38: 
	case 87:
		g_select = 0;
		break;
	case 40: 
	case 83:
		g_select = 1;
		break;
	case 13:
		exec_command(g_select);
		break;
	}
}
