 /**
  * StInput v2.0.1
  */
 (function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.StInput = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){

    /**
     * State-based Input manager to handle mouse and keyboard events on all modern browsers.
     * This library provide a state-query API, in oppose to the default event-based API given by browsers.
     * eg instead of registering callbacks to respond to mouse down event, you can use it like this:
     * if (stinput.down('mouse_left'))
     *      // do something...
     * 
     * This is especially useful for web apps like games and other things that have a main update loop.
     * 
     * Author: Ronen Ness.
     * Since: 2018.
     */
    
     "use strict";
    
    /**
     * A simple Point object for mouse position.
     */
    class Point
    {
       /**
        * Create the Point object.
        * @param {number} x Point X.
        * @param {number} y Point Y.
        */
       constructor(x = 0, y = 0)
       {
           this.x = x;
           this.y = y;
       }
    
       /**
        * Clone the point.
        */
       clone()
       {
           return new Point(this.x, this.y);
       }
    
       /**
        * Set point value.
        */
       set(x, y)
       {
           this.x = x;
           this.y = y;
       }
    
       /**
        * Return if point equals another point.
        * @param {*} other Other point to compare to.
        */
       equals(other)
       {
           return ((this === other) || (this.x === other.x && this.y === other.y));
       }
    
       /**
        * Get point (0,0).
        */
       static get zero()
       {
           return new Point();
       }
    }
    
    /**
     * Simple state-based input manager to handle mouse and keyboard events.
     * To use make sure to call .endFrame() at the end of every frame in your main loop.
     */
    class StInput
    {
        /**
         * Create the input manager.
         * @param {DomElement} element Element to register callbacks on.
         */
        constructor(element)
        {
            // sanity
            if (!element) {
                element = window;
                console.warn("'element' not provided to StInput; Will use 'window' instead, which is not always recommended.")
            }

            // set all the events to listen to
            var _this = this;
            this._callbacks = {
                'mousedown': function(event) {_this._onMouseDown(event); if (this.preventDefaults) event.preventDefault(); },
                'mouseup': function(event) {_this._onMouseUp(event); if (this.preventDefaults) event.preventDefault(); },
                'mousemove': function(event) {_this._onMouseMove(event); if (this.preventDefaults) event.preventDefault(); },
                'keydown': function(event) {_this._onKeyDown(event); if (this.preventDefaults) event.preventDefault(); },
                'keyup': function(event) {_this._onKeyUp(event); if (this.preventDefaults) event.preventDefault(); },
                'blur': function(event) {_this._onBlur(event); if (this.preventDefaults) event.preventDefault(); },
                'wheel': function(event) {_this._onMouseWheel(event); },
                'touchstart': function(event) {_this._onMouseDown(event); if (this.preventDefaults) event.preventDefault(); },
                'touchend': function(event) {_this._onMouseUp(event); if (this.preventDefaults) event.preventDefault(); },
                'touchmove': function(event) {_this._onMouseMove(event); if (this.preventDefaults) event.preventDefault(); },
                'contextmenu': function(event) { if (_this.disableContextMenu) { event.preventDefault(); } },
            };
            
            // just for easier access
            this.MouseButtons = StInput.MouseButtons;
            this.KeyboardKeys = StInput.KeyboardKeys;

            // if true, will prevent all default events
            this.preventDefaults = false;

            // by default, when holding wheel button down browsers will turn into special page scroll mode and will not emit mouse move events.
            // if this property is set to true, StInput will prevent this behavior, so we could still get mouse delta while mouse wheel is held down.
            this.enableMouseDeltaWhileMouseWheelDown = true;

            // if true, will disable context menu
            this.disableContextMenu = true;
    
            // should we reset on focus lost?
            this.resetOnFocusLoss = true;
    
            // reset all data to init initial state
            this._resetAll();
                    
            // register all callbacks
            for (var event in this._callbacks) {
                element.addEventListener(event, this._callbacks[event], false);
            }
        }
    
        /**
         * Clear this input manager resources.
         * This is especially important so we can remove the registered events, otherwise the gc can never collect this object.
         */
        dispose()
        {
            // unregister all callbacks
            if (this._callbacks)
            {
                for (var event in this._callbacks) {
                    window.removeEventListener(event, this._callbacks[event]);
                }
                this._callbacks = null;
            }
        }
    
        /**
         * Reset all internal data and states.
         */
        _resetAll()
        {
            // mouse states
            this._mousePos = new Point();
            this._mousePrevPos = new Point();
            this._mouseState = {};
            this._mousePrevState = {};
            this._mouseWheel = 0;
    
            // keyboard keys
            this._keyboardState = {};
            this._keyboardPrevState = {};
        }
        
        /**
         * Get mouse position.
         * @returns {Point} Mouse position.
         */
        get mousePosition()
        {
            return this._mousePos.clone();
        }
            
        /**
         * Get mouse previous position (before the last endFrame() call).
         * @returns {Point} Mouse position.
         */
        get prevMousePosition()
        {
            return (this._mousePrevPos || this._mousePos).clone();
        }
    
        /**
         * Get mouse movement since last endFrame() call.
         * @returns {Point} Mouse diff.
         */
        get mouseDelta()
        {
            // no previous position? return 0,0.
            if (!this._mousePrevPos) {
                return Point.zero;
            }
    
            // return mouse delta
            return new Point(this._mousePos.x - this._mousePrevPos.x, this._mousePos.y - this._mousePrevPos.y);
        }
    
        /**
         * Get if mouse is currently moving.
         */
        get mouseMoving()
        {
            return (this._mousePrevPos && !this._mousePrevPos.equals(this._mousePos));
        }
    
        /**
         * Get if mouse button was pressed this frame.
         * @param {MouseButtons} button Button code (defults to MouseButtons.left).  
         */
        mousePressed(button = 0)
        {
            if (button === undefined) throw new Error("Invalid button code!");
            return this._mouseState[button] && !this._mousePrevState[button];
        }
    
        /**
         * Get if mouse button is currently pressed.
         * @param {MouseButtons} button Button code (defults to MouseButtons.left).  
         */
        mouseDown(button = 0)
        {
            if (button === undefined) throw new Error("Invalid button code!");
            return this._mouseState[button];
        }
    
        /**
         * Get if mouse button is currently not pressed.
         * @param {MouseButtons} button Button code (defults to MouseButtons.left).
         */
        mouseUp(button = 0)
        {
            if (button === undefined) throw new Error("Invalid button code!");
            return !this.mouseDown(button);
        }
        
        /**
         * Get if mouse button was clicked since last endFrame() call.
         * @param {MouseButtons} button Button code (defults to MouseButtons.left).
         */
        mouseReleased(button = 0)
        {
            if (button === undefined) throw new Error("Invalid button code!");
            return !this._mouseState[button] && this._mousePrevState[button];
        }
    
        /**
         * Get if keyboard key is currently pressed.
         * @param {KeyboardKeys} key Keyboard key code.
         */
        keyDown(key)
        {
            if (key === undefined) throw new Error("Invalid key code!");
            return this._keyboardState[key];
        }
    
        /**
         * Get if keyboard key is currently not pressed.
         * @param {KeyboardKeys} key Keyboard key code.
         */
        keyUp(key)
        {
            if (key === undefined) throw new Error("Invalid key code!");
            return !this.keyDown(key);
        }
    
        /**
         * Get if keyboard key was released this frame.
         * @param {KeyboardKeys} key Keyboard key code.
         */
        keyReleased(key)
        {
            if (key === undefined) throw new Error("Invalid key code!");
            return !this._keyboardState[key] && this._keyboardPrevState[key];
        }
    
        /**
         * Get if keyboard key was pressed this frame.
         * @param {KeyboardKeys} key Keyboard key code.
         */
        keyPressed(key)
        {
            if (key === undefined) throw new Error("Invalid key code!");
            return this._keyboardState[key] && !this._keyboardPrevState[key];
        }
    
        /**
         * Get if shift is currently pressed.
         */
        get shiftDown()
        {
            return this.keyDown(this.KeyboardKeys.shift);
        }
    
        /**
         * Get if ctrl is currently pressed.
         */
        get ctrlDown()
        {
            return this.keyDown(this.KeyboardKeys.ctrl);
        }
    
        /**
         * Get if alt is currently pressed.
         */
        get altDown()
        {
            return this.keyDown(this.KeyboardKeys.alt);
        }
    
        /**
         * Get if any keyboard key is currently down.
         */
        get anyKeyDown()
        {
            for (var key in this._keyboardState) {
                if (this._keyboardState[key]) {
                    return true;
                }
            }
            return false;
        }
    
        /**
         * Return if a mouse or keyboard state in a generic way, used internally.
         * @param {string} code Keyboard or mouse code. 
         *                          For mouse buttons: mouse_left, mouse_right or mouse_middle.
         *                          For keyboard buttons: use one of the keys of KeyboardKeys (for example 'a', 'alt', 'up_arrow', etc..)
         *                          For numbers (0-9): you can use the number.
         * @param {Function} mouseCheck Callback to use to return value if its a mouse button code.
         * @param {Function} keyboardCheck Callback to use to return value if its a keyboard key code.
         */
        _getValueWithCode(code, mouseCheck, keyboardCheck)
        {
            // make sure code is string
            code = String(code);
    
            // if starts with 'mouse' its for mouse button events
            if (code.indexOf('mouse_') === 0) {
    
                // get mouse code name
                var codename = code.split('_')[1];
    
                // return if mouse down
                return mouseCheck.call(this, this.MouseButtons[codename]);
            }
    
            // if its just a number, add the 'n' prefix
            if (!isNaN(parseInt(code)) && code.length === 1) {
                code = 'n' + code;
            }
    
            // if not start with 'mouse', treat it as a keyboard key
            return keyboardCheck.call(this, this.KeyboardKeys[code]);
        }
    
        /**
         * Return if a mouse or keyboard button is currently down.
         * @param {string} code Keyboard or mouse code. 
         *                          For mouse buttons: mouse_left, mouse_right or mouse_middle.
         *                          For keyboard buttons: use one of the keys of KeyboardKeys (for example 'a', 'alt', 'up_arrow', etc..)
         *                          For numbers (0-9): you can use the number.
         */
        down(code)
        {
            return this._getValueWithCode(code, this.mouseDown, this.keyDown);
        }
    
        /**
         * Return if a mouse or keyboard button was released in this frame.
         * @param {string} code Keyboard or mouse code. 
         *                          For mouse buttons: mouse_left, mouse_right or mouse_middle.
         *                          For keyboard buttons: use one of the keys of KeyboardKeys (for example 'a', 'alt', 'up_arrow', etc..)
         *                          For numbers (0-9): you can use the number.
         */
        released(code)
        {
            return this._getValueWithCode(code, this.mouseReleased, this.keyReleased);
        }
    
        /**
         * Return if a mouse or keyboard button was pressed in this frame.
         * @param {string} code Keyboard or mouse code. 
         *                          For mouse buttons: mouse_left, mouse_right or mouse_middle.
         *                          For keyboard buttons: use one of the keys of KeyboardKeys (for example 'a', 'alt', 'up_arrow', etc..)
         *                          For numbers (0-9): you can use the number.
         */
        pressed(code)
        {
            return this._getValueWithCode(code, this.mousePressed, this.keyPressed);
        }
    
        /**
         * Get mouse wheel sign.
         */
        get mouseWheelDirection()
        {
            return Math.sign(this._mouseWheel);
        }
    
        /**
         * Get mouse wheel.
         */
        get mouseWheel()
        {
            return this._mouseWheel;
        }
    
        /**
         * update event states.
         * Call this every frame, *at the end of your main loop code*, to make sure events like mouse-click and mouse move work.
         */
        endFrame()
        {
            // set mouse previous position and clear mouse move cache
            this._mousePrevPos = this._mousePos.clone();
    
            // set previous keyboard state
            this._keyboardPrevState = {};
            for (var key in this._keyboardState) {
                this._keyboardPrevState[key] = this._keyboardState[key];
            }
    
            // set previous mouse state
            this._mousePrevState = {};
            for (var key in this._mouseState) {
                this._mousePrevState[key] = this._mouseState[key];
            }
    
            // reset mouse wheel
            this._mouseWheel = 0;
        }
    
        /**
         * Get keyboard key code from event.
         */
        _getKeyboardKeyCode(event)
        {
            event = this._getEvent(event);
            return event.keyCode !== undefined ? event.keyCode : event.key.charCodeAt(0);
        }
    
        /**
         * Called when window loses focus - clear all input states to prevent keys getting stuck.
         */
        _onBlur(event)
        {
            if (this.resetOnFocusLoss) {
                this._resetAll();
            }
        }
    
        /**
         * Handle mouse wheel events.
         * @param {*} event Event data from browser.
         */
        _onMouseWheel(event)
        {
            this._mouseWheel = event.deltaY;
        }
    
        /**
         * Handle keyboard down event.
         * @param {*} event Event data from browser.
         */
        _onKeyDown(event)
        {
            var keycode = this._getKeyboardKeyCode(event);
            this._keyboardState[keycode] = true;
        }
    
        /**
         * Handle keyboard up event.
         * @param {*} event Event data from browser.
         */
        _onKeyUp(event)
        {
            var keycode = this._getKeyboardKeyCode(event);
            this._keyboardState[keycode || 0] = false;
        }
    
        /**
         * Handle mouse down event.
         * @param {*} event Event data from browser.
         */
        _onMouseDown(event)
        {
            event = this._getEvent(event);
            if (this.enableMouseDeltaWhileMouseWheelDown && (event.button === this.MouseButtons.middle))
            { 
                event.preventDefault(); 
            }
            this._mouseState[event.button || 0] = true;
        }
    
        /**
         * Handle mouse up event.
         * @param {*} event Event data from browser.
         */
        _onMouseUp(event)
        {
            event = this._getEvent(event);
            this._mouseState[event.button || 0] = false;
        }
    
        /**
         * Handle touch move event.
         * @param {*} event Event data from browser.
         */
        _onTouchMove(event)
        {
            // handle touch move
            if ( event.touches.length == 1 ) 
            {
                this._mousePos.x = event.touches[0].pageX;
                this._mousePos.y = event.touches[0].pageY;
            } 
            else 
            {
                this._mousePos.x = 0.5 * ( event.touches[0].pageX + event.touches[1].pageX );
                this._mousePos.y = 0.5 * ( event.touches[0].pageY + event.touches[1].pageY );
            }
        }
    
        /**
         * Handle mouse move event.
         * @param {*} event Event data from browser.
         */
        _onMouseMove(event)
        {
            // get event in a cross-browser way
            event = this._getEvent(event);
    
            // try to get position from event with some fallbacks
            var pageX = event.pageX; 
            if (pageX === undefined) { pageX = event.x; } 
            if (pageX === undefined) { pageX = event.offsetX; } 
            if (pageX === undefined) { pageX = event.clientX; }
    
            var pageY = event.pageY; 
            if (pageY === undefined) { pageY = event.y; } 
            if (pageY === undefined) { pageY = event.offsetY; } 
            if (pageY === undefined) { pageY = event.clientY; }
    
            // if pageX and pageY are not supported, use clientX and clientY instead
            if (pageX === undefined) {
                pageX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
                pageY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
            }
    
            // set current mouse position
            this._mousePos.x = pageX;
            this._mousePos.y = pageY;
        }
    
        /**
         * Get event either from event param or from window.event. 
         * This is for older browsers support.
         */
        _getEvent(event)
        {
            return event || window.event;
        }
    }
    
    // mouse button codes
    StInput.MouseButtons = {
        left: 0,
        middle: 1,
        right: 2,
    };
    
    // keyboard codes
    StInput.KeyboardKeys = {
        backspace: 8,
        tab: 9,
        enter: 13,
        shift: 16,
        ctrl: 17,
        alt: 18,
        break: 19,
        caps_lock: 20,
        escape: 27,
        page_up: 33,
        page_down: 34,
        end: 35,
        home: 36,
        left_arrow: 37,
        up_arrow: 38,
        right_arrow: 39,
        down_arrow: 40,
        insert: 45,
        delete: 46,
        space: 32,
        n0: 48,
        n1: 49,
        n2: 50,
        n3: 51,
        n4: 52,
        n5: 53,
        n6: 54,
        n7: 55,
        n8: 56,
        n9: 57,
        a: 65,
        b: 66,
        c: 67,
        d: 68,
        e: 69,
        f: 70,
        g: 71,
        h: 72,
        i: 73,
        j: 74,
        k: 75,
        l: 76,
        m: 77,
        n: 78,
        o: 79,
        p: 80,
        q: 81,
        r: 82,
        s: 83,
        t: 84,
        u: 85,
        v: 86,
        w: 87,
        x: 88,
        y: 89,
        z: 90,
        left_window_key: 91,
        right_window_key: 92,
        select_key: 93,
        numpad_0: 96,
        numpad_1: 97,
        numpad_2: 98,
        numpad_3: 99,
        numpad_4: 100,
        numpad_5: 101,
        numpad_6: 102,
        numpad_7: 103,
        numpad_8: 104,
        numpad_9: 105,
        multiply: 106,
        add: 107,
        subtract: 109,
        decimal_point: 110,
        divide: 111,
        f1: 112,
        f2: 113,
        f3: 114,
        f4: 115,
        f5: 116,
        f6: 117,
        f7: 118,
        f8: 119,
        f9: 120,
        f10: 121,
        f11: 122,
        f12: 123,
        numlock: 144,
        scroll_lock: 145,
        semicolon: 186,
        equal_sign: 187,
        comma: 188,
        dash: 189,
        period: 190,
        forward_slash: 191,
        grave_accent: 192,
        open_bracket: 219,
        back_slash: 220,
        close_braket: 221,
        single_quote: 222,
    };
    
    // export the input manager class.
    module.exports = StInput;
    
    },{}]},{},[1])(1)
    });