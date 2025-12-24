/**
 * @file Graphics
 *
 * Routines for drawing the air hockey scene on the
 * canvas 2d graphics context.
 */
export class Graphics {

  /**
   * Draw a sliding disk.
   * @param {object} ctx The graphics context
   * @param {object} disk The Disk instance to draw
   */
  static drawDisk(ctx, disk) {

    const { x, y } = disk.getPosition();
    const angle = disk.getAngle();

    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, disk.radius, angle, angle + Math.PI * 2);
    ctx.stroke();
  }

  /**
   * Draw a solid obstacle.
   * @param {object} ctx The graphics context
   * @param {object} obstacle The Obstacle instance to draw
   */
  static drawObstacle(ctx, obstacle) {

    ctx.fillStyle = 'black';

    ctx.beginPath();
    for (const { x, y } of obstacle.getVertices()) {
      ctx.lineTo(x, y);
    }
    ctx.closePath();

    ctx.fill();
  }
}
