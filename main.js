//Grid Object
var Grid = function ( x, y, w, h, s, l ) {

	this.x = x || 0;
	this.y = y || 0;
	this.w = w || 0;
	this.h = h || 0;
	this.s = s || 0;
	this.l = l || 1;

	this.update = false;

};

Grid.prototype.draw = function( ctx ) {

	ctx.lineWidth = this.l;

	//Vertical lines
	for ( var x = ( this.x + this.s ); x < this.w; x+=this.s ) {

		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, this.h);
		ctx.stroke();

	}

	for ( var y = ( this.y + this.s ); y < this.h; y+=this.s ) {

		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(this.w, y);
		ctx.stroke();

	}


};

Grid.prototype.contains = function( x, y ) {

	return ( this.x <= x ) && ( this.x + this.w >= x ) && ( this.y <= y ) && ( this.y + this.h >= y );

};

//Vars			
var $d = document,
	$b = $d.body,
	canvas = $b.querySelector('#canvas-ig canvas'),
	ctx = canvas.getContext('2d'),
	sClassDrag = 'dropzone',
	sClassDrop = 'loading',
	sClassCanvas = 'canvas',
	grid, img;

//Events
//when we drag a file over the page
var dragOver = function ( e ) {

	e.preventDefault();

	$b.classList.add( sClassDrag );

};

//when we drag outside the page
var dragLeave = function ( e ) {

	$b.classList.remove( sClassDrag );

};

//When we drop the file
var drop = function ( e ) {

	e.preventDefault();

	$b.classList.remove( sClassDrag );

	$b.classList.add( sClassDrop );

	var files = e.dataTransfer.files;

	for ( var i = 0, f; f = files[i]; i++ ) {

		if ( !f.type.match('image.*') ) {

			$b.classList.remove( sClassDrop );
			
			//TODO: Notify file format
			console.log( 'error', 'f.type', f.type );

		} else {

			var reader = new FileReader();

			reader.onload = function ( file ) {

				img = new Image();

				img.onload = function () {

					//Change canvas size to image size
					//Will be resize with css
					canvas.width = img.width;
					canvas.height = img.height;

					var rect = canvas.getBoundingClientRect();

					//Get grid data
					var isWidthBigger = canvas.width > canvas.height,
						sqrSize = Math.min( canvas.width, canvas.height ),
						rctW = isWidthBigger ? ( Math.floor( canvas.width / sqrSize ) * sqrSize ) : canvas.width ,
						rctH = isWidthBigger ? canvas.height : ( Math.floor( canvas.height / sqrSize ) * sqrSize ),
						rctX = Math.floor( ( canvas.width - rctW ) / 2 ),
						rctY = Math.floor( ( canvas.height - rctH ) / 2 ),
						rctLineWidth = isWidthBigger ? canvas.width / rect.width : canvas.height / rect.height ;
					
					//Create Grid Object
					grid = new Grid( rctX, rctY, rctW, rctH, sqrSize, rctLineWidth );
					
					$b.classList.remove( sClassDrop );

					$b.classList.add( sClassCanvas );

					drawCanvas();

					setInterval( function () {
						if (grid.update) {
							drawCanvas();
						}
					}, 30 );

				};

				img.src = file.target.result;

			};

			reader.readAsDataURL( f );

		}

	}

}

//Drag Object
var Drag = function () {

	this.isGridSelected = false;

	this.startPosition = { x: 0, y: 0 };

	this.gridPosition = { x: 0, y: 0 };

};

var drag = new Drag();

//When we click in canvas
var canvasMouseDown = function ( e ) {

	drag.startPosition = getMousePosition( canvas, e );

	drag.isGridSelected = grid.contains(drag.startPosition.x, drag.startPosition.y);

	drag.gridPosition = { x: grid.x, y: grid.y };

}

//when we move the mouse in canvas
var canvasMouseMove = function ( e ) {

	if(drag.isGridSelected) {

		var mousePosition = getMousePosition( canvas, e );

		var moveX = drag.gridPosition.x + mousePosition.x - drag.startPosition.x;
		var moveY = drag.gridPosition.y + mousePosition.y - drag.startPosition.y;

		if (canvas.width > canvas.height)
			grid.x = moveX > 0 ? ( ( moveX + grid.w ) > canvas.width ? ( canvas.width - grid.w ) : moveX ) : 0 ;

		else
			grid.y = moveY > 0 ? ( ( moveY + grid.h ) > canvas.height ? ( canvas.height - grid.h ) : moveY ) : 0 ;

		grid.update = true;

	}

};

//When we release drag
var canvasMouseUp = function ( e ) {

	drag.isGridSelected = false;

};

//When Double Click in Canvas
var canvasDblClick = function ( e ) {

	//Get Mouse position
	var mousePosition = getMousePosition( canvas, e );

	//Is in Grid
	if (grid.contains(mousePosition.x, mousePosition.y)) {

		//Get Square
		for ( var x = grid.x ; x < grid.w ; x += grid.s ) {

			for ( var y = grid.y ; y < grid.h ; y += grid.s ) {

				if ( x <= mousePosition.x && ( x + grid.s ) > mousePosition.x && y <= mousePosition.y && ( y + grid.s ) > mousePosition.y ) {

					//Create new canvas with image position
					var canvasImage = $d.createElement('canvas'),
						ctxImage = canvasImage.getContext('2d');
					canvasImage.id = 'canvas-image';
					canvasImage.width = grid.s;
					canvasImage.height = grid.s;
					ctxImage.drawImage( img, x, y, grid.s, grid.s, 0, 0, grid.s, grid.s );

					window.open( canvasImage.toDataURL('image/jpeg', 1.0) );

				}

			}

		}
		
		//Download Square
	}

}

//Get Mouse position in canvas
function getMousePosition( canvas, e ) {
	
	var rect = canvas.getBoundingClientRect(),
		scaleX = canvas.width / rect.width,
		scaleY = canvas.height / rect.height;

	return {
		x: (e.clientX - rect.left) * scaleX,
		y: (e.clientY - rect.top) * scaleY
	}
};

var drawCanvas = function () {

	//Draw Image
	ctx.drawImage( img, 0, 0 );
	//Draw Grid
	grid.draw(ctx);
	//Draw Blur
	ctx.globalAlpha = 0.5;
	if ( canvas.width > canvas.height ) {
		ctx.fillRect( 0, 0, grid.x, grid.h );
		ctx.fillRect( ( grid.x + grid.w ), 0, canvas.width, grid.h);
	}
	else {
		ctx.fillRect( 0, 0, grid.w, grid.y );
		ctx.fillRect( 0, ( grid.y + grid.h ), canvas.height, grid.w );
	}
	ctx.globalAlpha = 1;

};

canvas.addEventListener( 'mousedown', canvasMouseDown, true );
canvas.addEventListener( 'mousemove', canvasMouseMove, true );
canvas.addEventListener( 'mouseup', canvasMouseUp, true );
canvas.addEventListener( 'dblclick', canvasDblClick, true );

$b.addEventListener( 'dragover', dragOver, false );
$b.addEventListener( 'dragleave', dragLeave, false );
$b.addEventListener( 'drop', drop, false );
