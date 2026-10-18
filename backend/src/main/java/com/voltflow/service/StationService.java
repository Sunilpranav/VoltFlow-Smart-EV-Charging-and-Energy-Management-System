package com.voltflow.service;

import com.voltflow.dto.ChargerResponse;
import com.voltflow.dto.StationResponse;
import com.voltflow.dto.StationSummaryResponse;
import com.voltflow.entity.Charger;
import com.voltflow.entity.Station;
import com.voltflow.exception.ResourceNotFoundException;
import com.voltflow.repository.ChargerRepository;
import com.voltflow.repository.StationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class StationService {

    private final StationRepository stationRepository;
    private final ChargerRepository chargerRepository;

    public StationService(StationRepository stationRepository,
                          ChargerRepository chargerRepository) {
        this.stationRepository = stationRepository;
        this.chargerRepository = chargerRepository;
    }

    public List<StationSummaryResponse> getStations(String search, String status) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty()) ? status.trim() : null;

        List<Station> stations;
        if (cleanSearch != null || cleanStatus != null) {
            stations = stationRepository.searchStations(cleanSearch, cleanStatus);
        } else {
            stations = stationRepository.findAll();
        }

        return stations.stream()
                .map(this::mapToSummary)
                .toList();
    }

    public StationResponse getStationById(Long id) {
        Station station = stationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Charging station not found with id: " + id));

        List<ChargerResponse> chargers = chargerRepository.findByStationId(id).stream()
                .map(this::mapToChargerResponse)
                .toList();

        int totalChargers = chargers.size();
        int availableChargers = (int) chargers.stream()
                .filter(c -> "AVAILABLE".equalsIgnoreCase(c.status()))
                .count();

        return new StationResponse(
                station.getId(),
                station.getName(),
                station.getAddress(),
                station.getLatitude(),
                station.getLongitude(),
                station.getStatus(),
                totalChargers,
                availableChargers,
                chargers,
                station.getCreatedAt()
        );
    }

    public List<ChargerResponse> getStationChargers(Long stationId) {
        if (!stationRepository.existsById(stationId)) {
            throw new ResourceNotFoundException("Charging station not found with id: " + stationId);
        }
        return chargerRepository.findByStationId(stationId).stream()
                .map(this::mapToChargerResponse)
                .toList();
    }

    public List<ChargerResponse> getChargers(Long stationId, String connectorType, String status) {
        String cleanConnector = (connectorType != null && !connectorType.trim().isEmpty()) ? connectorType.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty()) ? status.trim() : null;

        List<Charger> chargers = chargerRepository.findFilteredChargers(stationId, cleanConnector, cleanStatus);
        return chargers.stream()
                .map(this::mapToChargerResponse)
                .toList();
    }

    private StationSummaryResponse mapToSummary(Station station) {
        List<Charger> chargers = chargerRepository.findByStationId(station.getId());
        int total = chargers.size();
        int available = (int) chargers.stream()
                .filter(c -> "AVAILABLE".equalsIgnoreCase(c.getStatus()))
                .count();

        return new StationSummaryResponse(
                station.getId(),
                station.getName(),
                station.getAddress(),
                station.getLatitude(),
                station.getLongitude(),
                station.getStatus(),
                total,
                available
        );
    }

    private ChargerResponse mapToChargerResponse(Charger charger) {
        return new ChargerResponse(
                charger.getId(),
                charger.getStation() != null ? charger.getStation().getId() : null,
                charger.getChargerCode(),
                charger.getConnectorType(),
                charger.getMaxPowerKw(),
                charger.getStatus(),
                charger.getCreatedAt()
        );
    }
}
