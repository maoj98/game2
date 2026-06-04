type KeyState = { pressed: boolean; justPressed: boolean }

export class InputManager {
  private keys: Map<string, KeyState> = new Map()
  private static instance: InputManager

  private constructor() {
    window.addEventListener('keydown', (e) => {
      const state = this.keys.get(e.code)
      if (!state) {
        this.keys.set(e.code, { pressed: true, justPressed: true })
      } else if (!state.pressed) {
        state.pressed = true
        state.justPressed = true
      }
    })
    window.addEventListener('keyup', (e) => {
      const state = this.keys.get(e.code)
      if (state) {
        state.pressed = false
        state.justPressed = false
      }
    })
  }

  static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager()
    }
    return InputManager.instance
  }

  isPressed(code: string): boolean {
    return this.keys.get(code)?.pressed ?? false
  }

  isJustPressed(code: string): boolean {
    return this.keys.get(code)?.justPressed ?? false
  }

  resetJustPressed(): void {
    this.keys.forEach((state) => {
      state.justPressed = false
    })
  }
}
