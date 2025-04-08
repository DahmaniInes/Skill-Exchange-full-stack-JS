import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../../layouts/MainLayout";
import RoadmapTimeline from "../../components/RoadmapTimeline";
import ProgressTracker from "../../components/ProgressTracker";
import FeedbackForm from "../../components/FeedbackForm";
import { toast } from 'react-toastify';

// Set base URL for axios
axios.defaults.baseURL = 'http://localhost:5000';

const RoadmapPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!id) {
      console.error("ID is undefined or null!");
      setError("ID de roadmap manquant");
      setLoading(false);
      return;
    }

    console.log("ID récupéré depuis l'URL:", id);
    
    // Use AbortController for cleanup
    const controller = new AbortController();
    let isMounted = true;
    
    const fetchRoadmap = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('jwtToken');
        console.log('Token retrieved:', token ? 'Token exists' : 'No token found');
        console.log(`Making request to: /api/roadmaps/${id}`);
        
        const response = await axios.get(`/api/roadmaps/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          signal: controller.signal
        });
        
        if (!isMounted) return;
        
        console.log("Roadmap data received:", response.data);
        
        // Check if the response format is correct
        if (!response.data.roadmap) {
          console.error("Unexpected response format:", response.data);
          setError("Format de réponse inattendu");
          return;
        }
        
        setRoadmap(response.data.roadmap);
        
        // Déterminer l'étape active actuelle
        const currentActiveStep = response.data.roadmap.steps.findIndex(step => !step.completed);
        setActiveStep(currentActiveStep !== -1 ? currentActiveStep : 0);
        
      } catch (err) {
        if (!isMounted || err.name === 'CanceledError') return;
        
        console.error('Error full object:', err);
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
        
        if (err.response) {
          console.error('Response status:', err.response.status);
          console.error('Response data:', err.response.data);
          setError(`Erreur ${err.response.status}: ${err.response.data.message || 'Impossible de charger la roadmap'}`);
        } else if (err.request) {
          console.error('Request made but no response received');
          setError('Impossible de contacter le serveur. Vérifiez votre connexion.');
        } else {
          setError('Erreur lors de la préparation de la requête');
        }
        
        toast.error('Erreur de chargement de la roadmap');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchRoadmap();
    
    // Cleanup function
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [id]);

  const handleStepComplete = async (stepIndex) => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!roadmap) return;
      
      const updatedSteps = [...roadmap.steps];
      updatedSteps[stepIndex].completed = true;
      
      // Calculer la progression globale
      const completedSteps = updatedSteps.filter(step => step.completed).length;
      const overallProgress = Math.round((completedSteps / updatedSteps.length) * 100);
      
      console.log(`Marking step ${stepIndex} as completed. Overall progress: ${overallProgress}%`);
      
      // Mettre à jour en base de données
      const response = await axios.put(`/api/roadmaps/${id}/update-step/${stepIndex}`, {
        completed: true,
        overallProgress
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("Step update response:", response.data);
      
      // Mettre à jour l'état local
      setRoadmap({
        ...roadmap,
        steps: updatedSteps,
        overallProgress
      });
      
      // Mettre à jour l'étape active
      setActiveStep(stepIndex + 1);
      
      toast.success('Étape marquée comme terminée !');
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'étape:', err);
      
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
      
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleFeedbackSubmit = async (feedback) => {
    if (!roadmap) return;
    
    try {
      const token = localStorage.getItem('jwtToken');
      
      // Préparer les données de progression pour l'IA
      const progressData = {
        completedSteps: roadmap.steps.filter(step => step.completed).length,
        totalSteps: roadmap.steps.length,
        currentStep: activeStep,
        stepsProgress: roadmap.steps.map((step, index) => ({
          stepIndex: index,
          title: step.title,
          completed: step.completed
        }))
      };
      
      console.log("Submitting feedback with progress data:", progressData);
      
      // Appeler l'API pour mettre à jour la roadmap avec le feedback
      const response = await axios.put(`/api/roadmaps/${id}/update-with-feedback`, {
        feedback,
        progress: progressData
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("Feedback response:", response.data);
      
      // Mettre à jour la roadmap avec les données ajustées par l'IA
      setRoadmap(response.data.roadmap);
      
      toast.success('Votre feedback a été pris en compte. La roadmap a été ajustée !');
    } catch (err) {
      console.error('Erreur lors de l\'envoi du feedback:', err);
      
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
      
      toast.error('Erreur lors de l\'envoi du feedback');
    }
  };

  if (loading) return (
    <Layout>
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-800">{error}</p>
        <button 
          className="mt-4 bg-red-100 text-red-800 px-4 py-2 rounded-md hover:bg-red-200"
          onClick={() => navigate(-1)}
        >
          Retour
        </button>
      </div>
    </Layout>
  );

  if (!roadmap) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">{roadmap.title}</h1>
            <ProgressTracker progress={roadmap.overallProgress || 0} />
          </div>
          
          <p className="text-gray-600 mb-6">{roadmap.description}</p>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Votre parcours d'apprentissage</h2>
            <RoadmapTimeline 
              steps={roadmap.steps} 
              activeStep={activeStep}
              onStepComplete={handleStepComplete}
            />
          </div>
          
          {roadmap.steps[activeStep] && (
            <div className="bg-blue-50 p-6 rounded-lg mb-8">
              <h3 className="text-xl font-semibold mb-2">Étape actuelle: {roadmap.steps[activeStep].title}</h3>
              <p className="mb-4">{roadmap.steps[activeStep].description}</p>
              
              <div className="mb-4">
                <h4 className="font-medium text-gray-700">Durée estimée:</h4>
                <p>{roadmap.steps[activeStep].duration}</p>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium text-gray-700">Ressources recommandées:</h4>
                <ul className="list-disc pl-5">
                  {roadmap.steps[activeStep].resources && roadmap.steps[activeStep].resources.map((resource, idx) => (
                    <li key={idx} className="mb-1">{resource}</li>
                  ))}
                </ul>
              </div>
              
              {roadmap.steps[activeStep].progressIndicators && roadmap.steps[activeStep].progressIndicators.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700">Indicateurs de progression:</h4>
                  <ul className="list-disc pl-5">
                    {roadmap.steps[activeStep].progressIndicators.map((indicator, idx) => (
                      <li key={idx} className="mb-1">{indicator}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <button
                onClick={() => handleStepComplete(activeStep)}
                className="mt-4 bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition"
              >
                Marquer comme terminé
              </button>
            </div>
          )}
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Besoin d'ajuster votre roadmap?</h3>
            <FeedbackForm onSubmit={handleFeedbackSubmit} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RoadmapPage;