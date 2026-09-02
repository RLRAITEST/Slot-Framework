from game_executables import GameExecutables
from src.events.events import fs_trigger_event


class GameStateOverride(GameExecutables):
    """
    This class is is used to override or extend universal state.py functions.
    e.g: A specific game may have custom book properties to reset
    """

    def reset_book(self):
        super().reset_book()
        self.tumble_win = 0
        # Base spots persist through the tumble chain only; clear between rounds.
        self.reset_grid_mults()

    def reset_fs_spin(self):
        super().reset_fs_spin()
        # FS starts a fresh grid; spots then persist across the whole FS round.
        self.reset_grid_mults()

    def _cap_total_fs(self, value: int) -> int:
        return min(value, self.config.max_total_fs)

    def update_freespin_amount(self, scatter_key: str = "scatter") -> None:
        scatter_count = self.count_special_symbols(scatter_key)
        self.tot_fs = self._cap_total_fs(self.config.freespin_triggers[self.gametype][scatter_count])
        if self.gametype == self.config.basegame_type:
            basegame_trigger, freegame_trigger = True, False
        else:
            basegame_trigger, freegame_trigger = False, True
        fs_trigger_event(self, basegame_trigger=basegame_trigger, freegame_trigger=freegame_trigger)

    def update_fs_retrigger_amt(self, scatter_key: str = "scatter") -> None:
        scatter_count = self.count_special_symbols(scatter_key)
        added = self.config.freespin_triggers[self.gametype][scatter_count]
        self.tot_fs = self._cap_total_fs(self.tot_fs + added)
        fs_trigger_event(self, freegame_trigger=True, basegame_trigger=False)

    def assign_special_sym_function(self):
        pass

    def check_repeat(self) -> None:
        """Checks if the spin failed a criteria constraint at any point."""
        if self.repeat is False:
            win_criteria = self.get_current_betmode_distributions().get_win_criteria()
            if win_criteria is not None and self.final_win != win_criteria:
                self.repeat = True

            if self.get_current_distribution_conditions()["force_freegame"] and not (self.triggered_freegame):
                self.repeat = True

            if self.win_manager.running_bet_win == 0 and self.criteria != "0":
                self.repeat = True
