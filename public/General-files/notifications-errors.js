export class Notification{
    constructor(is_error,status,message){
        this.is_error = is_error;
        this.status = status;
        this.message = message;
    }
    create_pop_up(){

        const pop_up_div = document.createElement('div');
        pop_up_div.className = `pop_up ${this.is_error ? 'error' : 'success'}`;

        const message_div = document.createElement('div');
        message_div.className = 'message_div';

        const bar_div = document.createElement('div');
        bar_div.className = 'bar_div';

        const message_span = document.createElement('span');
        message_span.className = 'message';
        message_span.textContent = `${this.message} (${this.status})`;
        
        message_div.appendChild(message_span);
        pop_up_div.appendChild(message_div);
        pop_up_div.appendChild(bar_div);

        // Automatically injects into whatever page you are currently viewing
        document.body.appendChild(pop_up_div);
    }
}

export function pop_up(is_error, status,  message) {
    const noti = new Notification(is_error, status, message);
    noti.create_pop_up();
}