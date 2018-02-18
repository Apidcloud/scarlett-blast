
import Logger from "../common/logger";

/**
 * GameScene Class
 */
export default class Game {

  constructor(params) {
    params = params || {};

    let DEFAULT_VIRTUAL_WIDTH = 800;
    let DEFAULT_VIRTUAL_HEIGHT = 640;


    this._renderContext = null;
    this._logger = new Logger("Game");
  }

}
