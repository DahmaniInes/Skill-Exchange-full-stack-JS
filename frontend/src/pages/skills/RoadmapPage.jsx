import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useParams, useNavigate } from 'react-router-dom';
import RoadmapService from '../../services/RoadmapService'; // Remonte de deux dossiers (pages/skills -> src)
import './roadmap.css';

const RoadmapPage = () => {
  const { id } = useParams();
  const roadmapId = id;
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState(null);
  const [error, setError] = useState('');
  const [editStep, setEditStep] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRoadmap = async () => {
      if (!roadmapId || roadmapId === 'undefined') {
        setError('ID de roadmap invalide');
        setIsLoading(false);
        navigate('/marketplaceSkills');
        return;
      }

      try {
        setIsLoading(true);
        const response = await RoadmapService.getRoadmapById(roadmapId);
        if (response.success && response.roadmap) {
          setRoadmap(response.roadmap);
        } else {
          setError('Roadmap non trouvée');
          navigate('/marketplaceSkills');
        }
      } catch (err) {
        setError(err.message || 'Échec du chargement de la roadmap');
        navigate('/marketplaceSkills');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoadmap();
  }, [roadmapId, navigate]);

  const handleStepEdit = (step) => {
    setEditStep({ ...step });
  };

  const handleStepSave = async (stepId) => {
    try {
      const updates = {
        title: editStep.title,
        description: editStep.description,
        duration: editStep.duration,
        notes: editStep.notes,
        dependencies: editStep.dependencies,
      };
      const response = await RoadmapService.updateStep(roadmapId, stepId, updates);
      if (response.success) {
        setRoadmap(response.roadmap);
        setEditStep(null);
      } else {
        setError('Échec de la mise à jour de l’étape');
      }
    } catch (err) {
      setError(err.message || 'Échec de la mise à jour de l’étape');
    }
  };

  const handleStepChange = (field, value) => {
    setEditStep((prev) => ({ ...prev, [field]: value }));
  };

  const handleCompleteStep = async (stepId) => {
    try {
      const response = await RoadmapService.updateRoadmapStep(roadmapId, roadmap.steps.findIndex(step => step._id === stepId), true);
      if (response.success) {
        setRoadmap(response.roadmap);
      } else {
        setError('Échec de la marque de l’étape comme terminée');
      }
    } catch (err) {
      setError(err.message || 'Échec de la marque de l’étape comme terminée');
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const newSteps = Array.from(roadmap.steps);
    const [reorderedItem] = newSteps.splice(result.source.index, 1);
    newSteps.splice(result.destination.index, 0, reorderedItem);

    const newOrder = newSteps.map(step => step._id);
    try {
      const response = await RoadmapService.reorderSteps(roadmapId, newOrder);
      if (response.success) {
        setRoadmap(response.roadmap);
      } else {
        setError('Échec de la réorganisation des étapes');
      }
    } catch (err) {
      setError(err.message || 'Échec de la réorganisation des étapes');
    }
  };

  const handleDownload = async (format) => {
    try {
      const blob = await RoadmapService.downloadRoadmap(roadmapId, format);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `roadmap-${roadmapId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (err.message.includes('404')) {
        setError('Roadmap introuvable pour le téléchargement. Elle a peut-être été supprimée.');
      } else {
        setError(`Échec du téléchargement de la roadmap en ${format.toUpperCase()}: ${err.message}`);
      }
    }
  };

  if (isLoading) return <div>Chargement de la roadmap...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="roadmap-container">
      <h1>{roadmap.title}</h1>
      <p>{roadmap.description}</p>

      <div className="view-toggle">
        <button onClick={() => setViewMode('list')}>List View</button>
        <button onClick={() => setViewMode('gantt')}>Gantt View</button>
      </div>

      <div className="download-buttons">
        <button onClick={() => handleDownload('pdf')}>Download PDF</button>
        <button onClick={() => handleDownload('csv')}>Download CSV</button>
      </div>

      {viewMode === 'list' ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="steps">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="steps-list">
                {roadmap.steps && Array.isArray(roadmap.steps) ? (
                  roadmap.steps.map((step, index) => (
                    <Draggable key={step._id} draggableId={step._id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="step-item"
                        >
                          {editStep && editStep._id === step._id ? (
                            <div className="edit-step">
                              <input
                                type="text"
                                value={editStep.title}
                                onChange={(e) => handleStepChange('title', e.target.value)}
                              />
                              <textarea
                                value={editStep.description}
                                onChange={(e) => handleStepChange('description', e.target.value)}
                              />
                              <input
                                type="text"
                                value={editStep.duration}
                                onChange={(e) => handleStepChange('duration', e.target.value)}
                              />
                              <textarea
                                value={editStep.notes}
                                onChange={(e) => handleStepChange('notes', e.target.value)}
                                placeholder="Add notes..."
                              />
                              <label>Dependencies:</label>
                              <select
                                multiple
                                value={editStep.dependencies}
                                onChange={(e) => {
                                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                                  handleStepChange('dependencies', selected);
                                }}
                              >
                                {roadmap.steps
                                  .filter(s => s._id !== step._id)
                                  .map(s => (
                                    <option key={s._id} value={s._id}>{s.title}</option>
                                  ))}
                              </select>
                              <button onClick={() => handleStepSave(step._id)}>Save</button>
                              <button onClick={() => setEditStep(null)}>Cancel</button>
                            </div>
                          ) : (
                            <div>
                              <h3>{step.title}</h3>
                              <p>{step.description}</p>
                              <p>Duration: {step.duration}</p>
                              <p>Resources: {step.resources.join(', ')}</p>
                              <p>Notes: {step.notes || 'No notes'}</p>
                              {step.dependencies.length > 0 && (
                                <p>
                                  Depends on: {step.dependencies.map(dep => {
                                    const depStep = roadmap.steps.find(s => s._id === dep);
                                    return depStep ? depStep.title : 'Unknown';
                                  }).join(', ')}
                                </p>
                              )}
                              <button onClick={() => handleStepEdit(step)}>Edit</button>
                              {!step.completed && (
                                <button onClick={() => handleCompleteStep(step._id)}>
                                  Mark as Completed
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))
                ) : (
                  <p>No steps available for this roadmap.</p>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="gantt-view">
          {roadmap.steps && Array.isArray(roadmap.steps) ? (
            roadmap.steps.map((step, index) => (
              <div key={step._id} className="gantt-row">
                <span>{step.title}</span>
                <div className="gantt-bar" style={{ width: `${parseInt(step.duration) * 50}px` }}>
                  {step.duration}
                </div>
              </div>
            ))
          ) : (
            <p>No steps available for this roadmap.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default RoadmapPage;