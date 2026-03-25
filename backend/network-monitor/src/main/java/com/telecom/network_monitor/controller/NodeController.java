package com.telecom.network_monitor.controller;

import com.telecom.network_monitor.dto.ApiResponse;
import com.telecom.network_monitor.dto.NodeDTO;
import com.telecom.network_monitor.dto.NodeRequestDTO;
import com.telecom.network_monitor.service.NodeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/nodes")
@Tag(name = "Node API", description = "APIs for managing telecom network nodes")
public class NodeController {

    private final NodeService nodeService;

    public NodeController(NodeService nodeService) {
        this.nodeService = nodeService;
    }

    @Operation(
            summary = "Create a new node",
            description = "Creates a telecom node with name, location and status",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            examples = @ExampleObject(
                                    name = "Create Node Example",
                                    value = """
                                            {
                                              "name": "Tower-A1",
                                              "location": "Gothenburg",
                                              "status": "ACTIVE"
                                            }
                                            """
                            )
                    )
            )
    )
    @PostMapping
    public ApiResponse<NodeDTO> createNode(@Valid @RequestBody NodeRequestDTO dto) {
        return new ApiResponse<>(true, "Node created successfully", nodeService.createNode(dto));
    }

    @Operation(summary = "Get all active nodes")
    @GetMapping
    public ApiResponse<List<NodeDTO>> getAllNodes() {
        return new ApiResponse<>(true, "Active nodes fetched successfully", nodeService.getAllNodes());
    }

    @Operation(summary = "Get active nodes with pagination")
    @GetMapping("/paged")
    public ApiResponse<Page<NodeDTO>> getAllNodesPaginated(Pageable pageable) {
        return new ApiResponse<>(true, "Paginated active nodes fetched successfully", nodeService.getAllNodesPaginated(pageable));
    }

    @Operation(summary = "Get all soft deleted nodes")
    @GetMapping("/deleted")
    public ApiResponse<List<NodeDTO>> getDeletedNodes() {
        return new ApiResponse<>(true, "Deleted nodes fetched successfully", nodeService.getDeletedNodes());
    }

    @Operation(summary = "Get node by ID")
    @GetMapping("/{id}")
    public ApiResponse<NodeDTO> getNodeById(@PathVariable Long id) {
        return new ApiResponse<>(true, "Node fetched successfully", nodeService.getNodeById(id));
    }

    @Operation(
            summary = "Update node by ID",
            description = "Updates node details such as name, location and status",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            examples = @ExampleObject(
                                    name = "Update Node Example",
                                    value = """
                                            {
                                              "name": "Tower-B2",
                                              "location": "Stockholm",
                                              "status": "MAINTENANCE"
                                            }
                                            """
                            )
                    )
            )
    )
    @PutMapping("/{id}")
    public ApiResponse<NodeDTO> updateNode(@PathVariable Long id, @Valid @RequestBody NodeRequestDTO dto) {
        return new ApiResponse<>(true, "Node updated successfully", nodeService.updateNode(id, dto));
    }

    @Operation(summary = "Soft delete node by ID", description = "Marks a node and its related incidents as deleted")
    @DeleteMapping("/{id}")
    public ApiResponse<Object> deleteNode(@PathVariable Long id) {
        return new ApiResponse<>(true, nodeService.deleteNode(id), null);
    }

    @Operation(summary = "Restore soft deleted node by ID", description = "Restores a soft deleted node and its related incidents")
    @PutMapping("/{id}/restore")
    public ApiResponse<Object> restoreNode(@PathVariable Long id) {
        return new ApiResponse<>(true, nodeService.restoreNode(id), null);
    }
}