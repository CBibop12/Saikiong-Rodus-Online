import { useState, useEffect } from "react";
import CharacterDistribution from "./CharacterSelection";
import MapSelection from "./MapSelection";
import CharacterPositioning from "./CharacterPositioning";
import ChatConsole from "./ChatConsole";
import { maps } from "../maps";

const NewGame = () => {
  const [step, setStep] = useState(
    () => Number(localStorage.getItem("gameStep")) || 1
  );
  const [teams, setTeams] = useState(() => {
    const savedTeams = localStorage.getItem("gameTeams");
    return savedTeams ? JSON.parse(savedTeams) : { team1: [], team2: [] };
  });

  const [selectedMap, setSelectedMap] = useState(() => {
    const savedMap = localStorage.getItem("selectedMap");
    return savedMap ? JSON.parse(savedMap) : null;
  });

  // Сохраняем текущий шаг игры в localStorage
  useEffect(() => {
    localStorage.setItem("gameStep", step);
  }, [step]);

  // Сохраняем текущие команды в localStorage
  useEffect(() => {
    localStorage.setItem("gameTeams", JSON.stringify(teams));
  }, [teams]);

  // Сохраняем выбранную карту в localStorage
  useEffect(() => {
    localStorage.setItem("selectedMap", JSON.stringify(selectedMap));
  }, [selectedMap]);

  const handleDistributionComplete = (distribution) => {
    setTeams(distribution);
    setStep(2);
  };

  const handleMapSelection = (map) => {
    setSelectedMap(map);
    setStep(3);
  };

  const handlePositioningComplete = (positionedTeams) => {
    setTeams({
      team1: positionedTeams.team1,
      team2: positionedTeams.team2,
    });
    setStep(4);
  };

  return (
    <div>
      {step === 1 && (
        <CharacterDistribution
          onDistributionComplete={handleDistributionComplete}
        />
      )}
      {step === 2 && (
        <MapSelection onMapSelect={handleMapSelection} maps={maps} />
      )}
      {step === 3 && selectedMap && (
        <CharacterPositioning
          teams={teams}
          selectedMap={selectedMap}
          onPositioningComplete={handlePositioningComplete}
        />
      )}
      {step === 4 && selectedMap && (
        <ChatConsole teams={teams} selectedMap={selectedMap} />
      )}
    </div>
  );
};

export default NewGame;
