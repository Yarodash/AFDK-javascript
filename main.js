var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var W,H;

function OnResize(e){
	canvas.width = W = window.innerWidth*window.devicePixelRatio;
	canvas.height = H = window.innerHeight*window.devicePixelRatio;
}
window.addEventListener('resize',OnResize);
OnResize();

function circle(x, y, radius, strokeColor, fillColor){
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2*Math.PI);
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.stroke();
}

function line(x1, y1, x2, y2, strokeColor){
    ctx.strokeStyle = strokeColor;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.stroke();
}

function rect(x1, y1, w, h, strokeColor, fillColor){
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x1+w, y1); ctx.lineTo(x1+w, y1+h); ctx.lineTo(x1, y1+h); ctx.lineTo(x1, y1);
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.stroke();
}

class Node{
    constructor(){
        this.state = false;
    }

    click(){
        this.state ^= true;
    }

    get_state(){
        return this.state;
    }

    set_state(value){
        this.state = value;
    }

    clone(){
        return new Node();
    }

    get_color(){
        return this.get_state() ? 'rgb(0,94,47)' : 'rgb(94, 0, 47)'
    }
}

class Wire{
    constructor(type_in, type_out, input_index, output_index, inpin=0, outpin=0){
        // ic, co, io, cc | 0 - node, 1 - component
        this.type_in = type_in;
        this.type_out = type_out;
        this.input_index = input_index;
        this.output_index = output_index;
        this.inpin = inpin;
        this.outpin = outpin;
    }

    clone(){
        return new Wire(this.type_in, this.type_out, this.input_index, this.output_index, this.inpin, this.outpin);
    }
}

class Component{
    constructor(){
        this.inputs = [];
        this.outputs = [];                
        this.components = [];
        this.wires = [];
    }

    add_input(){
        this.inputs.push(new Node(this.inputs.length))
    }

    add_output(){
        this.outputs.push(new Node(this.outputs.length))
    }

    add_wire(type_in, type_out, input_index, output_index, inpin=0, outpin=0){
        this.wires.push(new Wire(type_in, type_out, input_index, output_index, inpin, outpin));
    }

    add_component(obj){
        this.components.push(obj.clone())
    }

    remove_input(){
        this.inputs.splice(this.inputs.length-1, 1);
    }

    remove_output(){
        this.outputs.splice(this.outputs.length-1, 1);
    }

    set_state(index, value){
        this.inputs[index].set_state(value);
    }

    get_state(index){
        return this.outputs[index].get_state();
    }

    link(renderer){
        this.renderer = renderer;
    }

    calculate(){
        this.counter = 0;

        for (var i = 0; i < this.inputs.length; i++)
            for (var j = 0; j < this.wires.length; j++)
                if (this.wires[j].type_in == 0 && this.wires[j].type_out == 1 && this.wires[j].input_index == i){
                    console.log(i, j);
                    this.components[this.wires[j].output_index].set_state(this.wires[j].outpin, this.inputs[i].get_state())
                }

        for (var i = 0; i < this.components.length; i++){
            this.components[i].calculate();
            for (var j = 0; j < this.wires.length; j++)
                if (this.wires[j].type_in == 1 && this.wires[j].type_out == 1)
                    this.components[this.wires[j].output_index].set_state(this.wires[j].outpin, this.components[this.wires[j].input_index].get_state(this.wires[j].inpin));
        }

        for (var i = 0; i < this.outputs.length; i++)
            for (var j = 0; j < this.wires.length; j++){
                if (this.wires[j].type_out == 0 && this.wires[j].output_index == i){
                    if (this.wires[j].type_in == 0) {
                        this.outputs[this.wires[j].output_index].set_state(this.inputs[this.wires[j].input_index].get_state());
                    }
                    else {
                        console.log('ebat da', i, j);
                        this.outputs[this.wires[j].output_index].set_state(this.components[this.wires[j].input_index].get_state(this.wires[j].inpin));
                    }
                }
            }
    }

    clone(){
        var new_component = new Component();
        for (var i = 0; i < this.inputs.length; i++)
            new_component.inputs[i] = this.inputs[i].clone();

        for (var i = 0; i < this.outputs.length; i++)
            new_component.outputs[i] = this.outputs[i].clone();

        for (var i = 0; i < this.wires.length; i++)
            new_component.wires[i] = this.wires[i].clone();

        for (var i = 0; i < this.components.length; i++)
            new_component.components[i] = this.components[i].clone();

        return new_component;
    }
}

class AND_component extends Component{
    constructor(){
        super();
        this.inputs = [new Node(), new Node()];
        this.outputs = [new Node()];
    }

    calculate(){
        this.outputs[0].set_state(this.inputs[0].get_state() & this.inputs[1].get_state());
    }

    clone(){
        return new AND_component();
    }
}

class NOT_component extends Component{
    constructor(){
        super();
        this.inputs = [new Node()];
        this.outputs = [new Node()];
    }

    calculate(){
        this.outputs[0].set_state(!this.inputs[0].get_state());
    }

    clone(){
        return new NOT_component();
    }
}

var current_component = new Component();
current_component.add_input();
current_component.add_input();
current_component.add_output();
current_component.add_component(new AND_component());
current_component.add_component(new NOT_component());
current_component.add_wire(0, 1, 0, 0, 0, 0);
current_component.add_wire(0, 1, 1, 0, 0, 1);
current_component.add_wire(1, 1, 0, 1, 0, 0);
current_component.add_wire(1, 0, 1, 0, 0, 0);
