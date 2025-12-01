import { getPalette } from './colors.js';

/**
 * Spinner frame sets for different styles
 */
const SPINNERS = {
  braille: {
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    interval: 80,
  },
  dots: {
    frames: ['·', '•', '●', '•'],
    interval: 200,
  },
  minimal: {
    frames: ['-', '\\', '|', '/'],
    interval: 100,
  },
  quarters: {
    frames: ['◐', '◓', '◑', '◒'],
    interval: 120,
  },
} as const;

export type SpinnerStyle = keyof typeof SPINNERS;

/**
 * Animated spinner for terminal
 */
export class Spinner {
  private frameIndex = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private message: string;
  private style: SpinnerStyle;
  private colorScheme: 'default' | 'light' | 'minimal';

  constructor(
    message: string,
    style: SpinnerStyle = 'braille',
    colorScheme: 'default' | 'light' | 'minimal' = 'default'
  ) {
    this.message = message;
    this.style = style;
    this.colorScheme = colorScheme;
  }

  /**
   * Start the spinner animation
   */
  start(): this {
    if (this.intervalId) return this;

    const spinner = SPINNERS[this.style];
    const palette = getPalette(this.colorScheme);

    // Hide cursor
    process.stdout.write('\x1B[?25l');

    const render = () => {
      const frame = spinner.frames[this.frameIndex];
      this.frameIndex = (this.frameIndex + 1) % spinner.frames.length;

      // Clear line and write spinner
      process.stdout.write('\r\x1B[K');
      process.stdout.write(`${palette.thinking(frame)} ${palette.dim(this.message)}`);
    };

    render();
    this.intervalId = setInterval(render, spinner.interval);

    return this;
  }

  /**
   * Update the spinner message
   */
  update(message: string): this {
    this.message = message;
    return this;
  }

  /**
   * Stop the spinner with a success message
   */
  success(message?: string): void {
    this.stop();
    const palette = getPalette(this.colorScheme);
    const finalMessage = message || this.message;
    console.log(`${palette.success('✓')} ${finalMessage}`);
  }

  /**
   * Stop the spinner with a failure message
   */
  fail(message?: string): void {
    this.stop();
    const palette = getPalette(this.colorScheme);
    const finalMessage = message || this.message;
    console.log(`${palette.error('✗')} ${finalMessage}`);
  }

  /**
   * Stop the spinner with an info message
   */
  info(message?: string): void {
    this.stop();
    const palette = getPalette(this.colorScheme);
    const finalMessage = message || this.message;
    console.log(`${palette.stats('ℹ')} ${finalMessage}`);
  }

  /**
   * Stop the spinner silently
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    // Clear line and show cursor
    process.stdout.write('\r\x1B[K');
    process.stdout.write('\x1B[?25h');
  }

  /**
   * Check if spinner is currently running
   */
  isSpinning(): boolean {
    return this.intervalId !== null;
  }
}

/**
 * Create and start a spinner
 */
export function createSpinner(
  message: string,
  style: SpinnerStyle = 'braille',
  colorScheme: 'default' | 'light' | 'minimal' = 'default'
): Spinner {
  return new Spinner(message, style, colorScheme).start();
}

/**
 * Progress bar for known-length operations
 */
export class ProgressBar {
  private current = 0;
  private total: number;
  private width: number;
  private message: string;
  private colorScheme: 'default' | 'light' | 'minimal';

  constructor(
    total: number,
    message: string = '',
    width: number = 30,
    colorScheme: 'default' | 'light' | 'minimal' = 'default'
  ) {
    this.total = total;
    this.message = message;
    this.width = width;
    this.colorScheme = colorScheme;
  }

  /**
   * Update progress
   */
  update(current: number): void {
    this.current = Math.min(current, this.total);
    this.render();
  }

  /**
   * Increment progress by 1
   */
  increment(): void {
    this.update(this.current + 1);
  }

  /**
   * Render the progress bar
   */
  private render(): void {
    const palette = getPalette(this.colorScheme);
    const percent = this.current / this.total;
    const filled = Math.round(this.width * percent);
    const empty = this.width - filled;

    const bar = palette.success('█'.repeat(filled)) + palette.dim('░'.repeat(empty));
    const percentStr = `${Math.round(percent * 100)}%`.padStart(4);

    process.stdout.write('\r\x1B[K');
    process.stdout.write(`${bar} ${palette.stats(percentStr)} ${palette.dim(this.message)}`);
  }

  /**
   * Complete the progress bar
   */
  complete(message?: string): void {
    this.current = this.total;
    this.render();
    console.log();
    if (message) {
      const palette = getPalette(this.colorScheme);
      console.log(`${palette.success('✓')} ${message}`);
    }
  }
}
