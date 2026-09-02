from game_override import GameStateOverride
from game_events import update_grid_mult_event


class GameState(GameStateOverride):
    """Core function handling simulation results."""

    def _tumble_chain(self):
        """Eval already done. Upgrade spots, then cascade until dead or cap."""
        self.update_grid_mults()
        steps = 0
        while self.win_data["totalWin"] > 0 and not self.wincap_triggered:
            steps += 1
            if steps >= self.config.tumble_step_cap:
                break
            self.tumble_game_board()
            self.get_clusters_update_wins()
            self.emit_tumble_win_events()
            self.update_grid_mults()

    def run_spin(self, sim, simulation_seed=None):
        self.reset_seed(sim)
        self.repeat = True
        while self.repeat:
            self.reset_book()
            self.draw_board()

            self.get_clusters_update_wins()
            self.emit_tumble_win_events()
            self._tumble_chain()

            self.set_end_tumble_event()
            self.win_manager.update_gametype_wins(self.gametype)

            if self.check_fs_condition() and self.check_freespin_entry():
                self.run_freespin_from_base()

            self.evaluate_finalwin()
            self.check_repeat()

        self.imprint_wins()

    def run_freespin(self):
        self.reset_fs_spin()
        while self.fs < self.tot_fs:
            self.update_freespin()
            self.draw_board()
            update_grid_mult_event(self)

            self.get_clusters_update_wins()
            self.emit_tumble_win_events()
            self._tumble_chain()

            self.set_end_tumble_event()
            self.win_manager.update_gametype_wins(self.gametype)

            if self.check_fs_condition():
                self.update_fs_retrigger_amt()

        self.end_freespin()
